import { t } from "./messages";
import { formatDate } from "./format";
import { pickMobile } from "./phone";
import type { Office } from "./types";

/** تهريب خلية CSV مع حماية من حقن الصيغ في Excel. */
export function csvCell(value: string | number | null | undefined): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function officesToCsv(offices: Office[]): string {
  const header = [
    "place_id",
    t.table.name,
    t.table.city,
    t.table.address,
    t.table.rating,
    "عدد المراجعات",
    "الهاتف",
    "رقم واتساب",
    t.table.map,
    "الموقع الإلكتروني",
    t.table.status,
    t.table.lastContact,
    t.table.nextFollowup,
    "عدد مرات التواصل",
    t.table.notes,
    "آخر تحديث للبيانات",
  ];
  const rows = offices.map((o) => {
    const mobile = pickMobile(o.internationalPhone, o.nationalPhone);
    return [
      o.placeId,
      o.name,
      o.city,
      o.address,
      o.rating,
      o.ratingCount,
      o.nationalPhone,
      mobile.ok ? mobile.number : "",
      o.mapsUri,
      o.websiteUri,
      t.status[o.status],
      formatDate(o.lastContactAt),
      formatDate(o.nextFollowupAt),
      o.contactCount,
      o.notes,
      formatDate(o.dataUpdatedAt),
    ].map(csvCell);
  });
  // BOM ليعرض Excel العربية بشكل صحيح
  return "﻿" + [header.map(csvCell), ...rows].map((r) => r.join(",")).join("\r\n");
}
