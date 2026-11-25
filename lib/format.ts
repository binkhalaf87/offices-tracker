import { TIME_ZONE } from "./constants";

const dateFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateFmt.format(d);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : dateTimeFmt.format(d);
}

/** قيمة input[type=date] (YYYY-MM-DD) بتوقيت الرياض. */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(d);
}

/** من YYYY-MM-DD إلى ISO (التاسعة صباحاً بتوقيت الرياض). */
export function fromDateInputValue(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T09:00:00+03:00`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatPercent(part: number, whole: number): string {
  if (!whole) return "—";
  return `${Math.round((part / whole) * 1000) / 10}%`;
}
