import "server-only";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_DAILY_LIMIT, DEFAULT_TEMPLATE, MAX_DAILY_LIMIT, type OfficeStatus } from "./constants";
import { applyContact, canContact, riyadhDayKey, endOfRiyadhDay, type ContactCheck } from "./outreach";
import type { Office, Settings, TodayCounter } from "./types";
import type { PlaceData } from "./places";

const DB_PATH = path.join(process.cwd(), "data", "offices.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS offices (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id            TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  city                TEXT NOT NULL,
  address             TEXT,
  national_phone      TEXT,
  international_phone TEXT,
  rating              REAL,
  rating_count        INTEGER,
  maps_uri            TEXT,
  website_uri         TEXT,
  business_status     TEXT,
  status              TEXT NOT NULL DEFAULT 'not_contacted',
  notes               TEXT NOT NULL DEFAULT '',
  last_contact_at     TEXT,
  next_followup_at    TEXT,
  contact_count       INTEGER NOT NULL DEFAULT 0,
  data_updated_at     TEXT NOT NULL,
  created_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offices_city ON offices(city);
CREATE INDEX IF NOT EXISTS idx_offices_followup ON offices(next_followup_at);

CREATE TABLE IF NOT EXISTS contact_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  office_id  INTEGER NOT NULL REFERENCES offices(id) ON DELETE CASCADE,
  day        TEXT NOT NULL,
  opened_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contact_log_day ON contact_log(day);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

type OfficeRow = {
  id: number;
  place_id: string;
  name: string;
  city: string;
  address: string | null;
  national_phone: string | null;
  international_phone: string | null;
  rating: number | null;
  rating_count: number | null;
  maps_uri: string | null;
  website_uri: string | null;
  business_status: string | null;
  status: OfficeStatus;
  notes: string;
  last_contact_at: string | null;
  next_followup_at: string | null;
  contact_count: number;
  data_updated_at: string;
  created_at: string;
};

function rowToOffice(r: OfficeRow): Office {
  return {
    id: r.id,
    placeId: r.place_id,
    name: r.name,
    city: r.city,
    address: r.address,
    nationalPhone: r.national_phone,
    internationalPhone: r.international_phone,
    rating: r.rating,
    ratingCount: r.rating_count,
    mapsUri: r.maps_uri,
    websiteUri: r.website_uri,
    businessStatus: r.business_status,
    status: r.status,
    notes: r.notes,
    lastContactAt: r.last_contact_at,
    nextFollowupAt: r.next_followup_at,
    contactCount: r.contact_count,
    dataUpdatedAt: r.data_updated_at,
    createdAt: r.created_at,
  };
}

const globalForDb = globalThis as unknown as { __officesDb?: Database.Database };

export function db(): Database.Database {
  if (!globalForDb.__officesDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const conn = new Database(DB_PATH);
    conn.pragma("journal_mode = WAL");
    conn.pragma("foreign_keys = ON");
    conn.exec(SCHEMA);
    globalForDb.__officesDb = conn;
  }
  return globalForDb.__officesDb;
}

// ───────────── الإعدادات ─────────────

export function getSettings(): Settings {
  const rows = db().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const limit = Number(map.get("daily_limit"));
  return {
    template: map.get("template") ?? DEFAULT_TEMPLATE,
    dailyLimit: Number.isInteger(limit) && limit >= 1 && limit <= MAX_DAILY_LIMIT ? limit : DEFAULT_DAILY_LIMIT,
  };
}

export function saveSettings(s: Settings): void {
  const stmt = db().prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  db().transaction(() => {
    stmt.run("template", s.template);
    stmt.run("daily_limit", String(s.dailyLimit));
  })();
}

// ───────────── المكاتب ─────────────

export function listOffices(): Office[] {
  return (db().prepare("SELECT * FROM offices ORDER BY id DESC").all() as OfficeRow[]).map(rowToOffice);
}

export function getOffice(id: number): Office | null {
  const row = db().prepare("SELECT * FROM offices WHERE id = ?").get(id) as OfficeRow | undefined;
  return row ? rowToOffice(row) : null;
}

export function listDueFollowups(now: Date = new Date()): Office[] {
  const rows = db()
    .prepare(
      `SELECT * FROM offices
       WHERE next_followup_at IS NOT NULL AND next_followup_at <= ?
         AND status NOT IN ('refused', 'do_not_contact', 'registered')
       ORDER BY next_followup_at ASC`,
    )
    .all(endOfRiyadhDay(now).toISOString()) as OfficeRow[];
  return rows.map(rowToOffice);
}

export type OfficePatch = {
  status?: OfficeStatus;
  notes?: string;
  nextFollowupAt?: string | null;
};

export function updateOffice(id: number, patch: OfficePatch): Office | null {
  const current = getOffice(id);
  if (!current) return null;
  const status = patch.status ?? current.status;
  let nextFollowupAt = patch.nextFollowupAt !== undefined ? patch.nextFollowupAt : current.nextFollowupAt;
  // لا متابعة لمن رفض أو سجّل أو طلب عدم المراسلة
  if (patch.status && ["refused", "do_not_contact", "registered"].includes(patch.status)) nextFollowupAt = null;
  db()
    .prepare("UPDATE offices SET status = ?, notes = ?, next_followup_at = ? WHERE id = ?")
    .run(status, patch.notes ?? current.notes, nextFollowupAt, id);
  return getOffice(id);
}

export type UpsertStats = { created: number; updated: number };

/** إدراج أو تحديث بيانات Google فقط — لا يمسّ الحالة والملاحظات ولا المدينة الأصلية. */
export function upsertPlaces(places: PlaceData[], city: string, now: Date = new Date()): UpsertStats {
  const nowIso = now.toISOString();
  const exists = db().prepare("SELECT id FROM offices WHERE place_id = ?");
  const insert = db().prepare(
    `INSERT INTO offices (place_id, name, city, address, national_phone, international_phone, rating,
       rating_count, maps_uri, website_uri, business_status, data_updated_at, created_at)
     VALUES (@placeId, @name, @city, @address, @nationalPhone, @internationalPhone, @rating,
       @ratingCount, @mapsUri, @websiteUri, @businessStatus, @now, @now)`,
  );
  const update = db().prepare(
    `UPDATE offices SET name = @name, address = @address, national_phone = @nationalPhone,
       international_phone = @internationalPhone, rating = @rating, rating_count = @ratingCount,
       maps_uri = @mapsUri, website_uri = @websiteUri, business_status = @businessStatus,
       data_updated_at = @now
     WHERE place_id = @placeId`,
  );
  const stats: UpsertStats = { created: 0, updated: 0 };
  db().transaction(() => {
    for (const p of places) {
      const params = { ...p, city, now: nowIso };
      if (exists.get(p.placeId)) {
        update.run(params);
        stats.updated++;
      } else {
        insert.run(params);
        stats.created++;
      }
    }
  })();
  return stats;
}

export function refreshOfficeData(id: number, place: PlaceData, now: Date = new Date()): Office | null {
  db()
    .prepare(
      `UPDATE offices SET place_id = @placeId, name = @name, address = @address, national_phone = @nationalPhone,
         international_phone = @internationalPhone, rating = @rating, rating_count = @ratingCount,
         maps_uri = @mapsUri, website_uri = @websiteUri, business_status = @businessStatus,
         data_updated_at = @now
       WHERE id = @id`,
    )
    .run({ ...place, id, now: now.toISOString() });
  return getOffice(id);
}

// ───────────── التواصل والعداد اليومي ─────────────

export function countContactsOn(day: string): number {
  const row = db().prepare("SELECT COUNT(*) AS n FROM contact_log WHERE day = ?").get(day) as { n: number };
  return row.n;
}

export function getTodayCounter(now: Date = new Date()): TodayCounter {
  const day = riyadhDayKey(now);
  return { day, count: countContactsOn(day), limit: getSettings().dailyLimit };
}

export type RecordContactResult =
  | { ok: true; office: Office; number: string; counter: TodayCounter }
  | { ok: false; check: Extract<ContactCheck, { ok: false }> | null };

/**
 * يتحقق مجدداً من كل القيود ثم يسجّل فتح المحادثة في معاملة واحدة
 * (حتى لا يُتجاوز الحد اليومي بنقرات متزامنة).
 */
export function recordContact(id: number, now: Date = new Date()): RecordContactResult {
  const run = db().transaction((): RecordContactResult => {
    const office = getOffice(id);
    if (!office) return { ok: false, check: null };
    const day = riyadhDayKey(now);
    const { dailyLimit } = getSettings();
    const check = canContact(office, { countToday: countContactsOn(day), dailyLimit, now });
    if (!check.ok) return { ok: false, check };

    const u = applyContact(office, now);
    db()
      .prepare(
        "UPDATE offices SET status = ?, contact_count = ?, last_contact_at = ?, next_followup_at = ? WHERE id = ?",
      )
      .run(u.status, u.contactCount, u.lastContactAt, u.nextFollowupAt, id);
    db().prepare("INSERT INTO contact_log (office_id, day, opened_at) VALUES (?, ?, ?)").run(id, day, u.lastContactAt);

    return {
      ok: true,
      office: getOffice(id) as Office,
      number: check.number,
      counter: { day, count: countContactsOn(day), limit: dailyLimit },
    };
  });
  return run.immediate();
}

// ───────────── اللوحة ─────────────

export type CityStats = {
  city: string;
  total: number;
  contacted: number;
  replied: number;
  interested: number;
  registered: number;
};

export function getCityStats(): CityStats[] {
  return db()
    .prepare(
      `SELECT city,
         COUNT(*) AS total,
         SUM(CASE WHEN contact_count > 0 OR status IN ('contacted','replied','interested','registered','refused') THEN 1 ELSE 0 END) AS contacted,
         SUM(CASE WHEN status IN ('replied','interested','registered','refused') THEN 1 ELSE 0 END) AS replied,
         SUM(CASE WHEN status = 'interested' THEN 1 ELSE 0 END) AS interested,
         SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) AS registered
       FROM offices GROUP BY city ORDER BY total DESC`,
    )
    .all() as CityStats[];
}
