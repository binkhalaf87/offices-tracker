import {
  BLOCKED_STATUSES,
  FOLLOWUP_DELAY_DAYS,
  MAX_OUTREACH_CONTACTS,
  OUTREACH_STATUSES,
  TIME_ZONE,
  type OfficeStatus,
} from "./constants";
import { pickMobile, type PhoneResult } from "./phone";

const DAY_MS = 24 * 60 * 60 * 1000;

/** مفتاح اليوم (YYYY-MM-DD) بتوقيت الرياض — يُصفَّر العداد عند منتصف ليل الرياض. */
export function riyadhDayKey(date: Date = new Date()): string {
  // en-CA يعطي YYYY-MM-DD مباشرة
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** نهاية اليوم الحالي بتوقيت الرياض (UTC+3 ثابت، بلا توقيت صيفي). */
export function endOfRiyadhDay(date: Date = new Date()): Date {
  const key = riyadhDayKey(date);
  return new Date(`${key}T23:59:59.999+03:00`);
}

export function followupDateFrom(date: Date): Date {
  return new Date(date.getTime() + FOLLOWUP_DELAY_DAYS * DAY_MS);
}

export type DailyLimitResult = { allowed: boolean; remaining: number };

export function checkDailyLimit(countToday: number, limit: number): DailyLimitResult {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0;
  const remaining = Math.max(0, safeLimit - Math.max(0, countToday));
  return { allowed: remaining > 0, remaining };
}

export type ContactBlockReason =
  | { kind: "status"; status: OfficeStatus }
  | { kind: "phone"; reason: Exclude<PhoneResult, { ok: true }>["reason"] }
  | { kind: "followup_used" }
  | { kind: "followup_not_due"; dueAt: string }
  | { kind: "daily_limit"; limit: number };

export type ContactCheck =
  | { ok: true; number: string; isFollowup: boolean }
  | { ok: false; block: ContactBlockReason };

export type ContactableOffice = {
  status: OfficeStatus;
  internationalPhone: string | null;
  nationalPhone: string | null;
  contactCount: number;
  nextFollowupAt: string | null;
};

/**
 * القرار الوحيد لإمكانية فتح محادثة — يُستخدم في الواجهة (لتعطيل الزر وكتابة السبب)
 * وفي الخادم (للتحقق مجدداً قبل التسجيل).
 */
export function canContact(
  office: ContactableOffice,
  ctx: { countToday: number; dailyLimit: number; now?: Date },
): ContactCheck {
  const now = ctx.now ?? new Date();

  if (BLOCKED_STATUSES.includes(office.status)) {
    return { ok: false, block: { kind: "status", status: office.status } };
  }

  const phone = pickMobile(office.internationalPhone, office.nationalPhone);
  if (!phone.ok) return { ok: false, block: { kind: "phone", reason: phone.reason } };

  const isOutreach = OUTREACH_STATUSES.includes(office.status);
  if (isOutreach) {
    if (office.contactCount >= MAX_OUTREACH_CONTACTS) {
      return { ok: false, block: { kind: "followup_used" } };
    }
    if (office.contactCount >= 1 && office.nextFollowupAt) {
      const due = new Date(office.nextFollowupAt);
      if (!Number.isNaN(due.getTime()) && due.getTime() > now.getTime()) {
        return { ok: false, block: { kind: "followup_not_due", dueAt: office.nextFollowupAt } };
      }
    }
  }

  if (!checkDailyLimit(ctx.countToday, ctx.dailyLimit).allowed) {
    return { ok: false, block: { kind: "daily_limit", limit: ctx.dailyLimit } };
  }

  return { ok: true, number: phone.number, isFollowup: isOutreach && office.contactCount >= 1 };
}

export type ContactUpdate = {
  status: OfficeStatus;
  contactCount: number;
  lastContactAt: string;
  nextFollowupAt: string | null;
};

/** ما يتغيّر في سجل المكتب بعد فتح المحادثة. */
export function applyContact(office: ContactableOffice, now: Date = new Date()): ContactUpdate {
  const nowIso = now.toISOString();
  if (OUTREACH_STATUSES.includes(office.status)) {
    const contactCount = office.contactCount + 1;
    return {
      status: "contacted",
      contactCount,
      lastContactAt: nowIso,
      // بعد الرسالة الأولى: متابعة بعد يومين. بعد المتابعة: لا متابعة ثانية.
      nextFollowupAt: contactCount < MAX_OUTREACH_CONTACTS ? followupDateFrom(now).toISOString() : null,
    };
  }
  // مكتب ردّ أو مهتم: نكمل المحادثة دون تغيير حالته
  return {
    status: office.status,
    contactCount: office.contactCount,
    lastContactAt: nowIso,
    nextFollowupAt: office.nextFollowupAt,
  };
}
