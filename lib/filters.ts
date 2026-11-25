import { isOfficeStatus, type OfficeStatus } from "./constants";
import type { Office } from "./types";

export const SORT_KEYS = ["recent", "rating_desc", "rating_asc", "reviews_desc", "reviews_asc", "name"] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type OfficeFilters = {
  q: string;
  city: string; // "" = الكل
  status: OfficeStatus | "";
  minRating: number; // 0 = أي تقييم
  sort: SortKey;
};

export const DEFAULT_FILTERS: OfficeFilters = { q: "", city: "", status: "", minRating: 0, sort: "recent" };

export function parseFilters(params: URLSearchParams): OfficeFilters {
  const status = params.get("status") ?? "";
  const sort = params.get("sort") ?? "recent";
  const minRating = Number(params.get("minRating") ?? 0);
  return {
    q: (params.get("q") ?? "").slice(0, 200),
    city: (params.get("city") ?? "").slice(0, 50),
    status: isOfficeStatus(status) ? status : "",
    minRating: Number.isFinite(minRating) ? Math.min(5, Math.max(0, minRating)) : 0,
    sort: (SORT_KEYS as readonly string[]).includes(sort) ? (sort as SortKey) : "recent",
  };
}

export function filtersToParams(f: OfficeFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.city) p.set("city", f.city);
  if (f.status) p.set("status", f.status);
  if (f.minRating) p.set("minRating", String(f.minRating));
  if (f.sort !== "recent") p.set("sort", f.sort);
  return p;
}

/** يوحّد الحروف العربية للبحث (أ/إ/آ → ا، ة → ه، ى → ي، إزالة التشكيل). */
export function normalizeArabic(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

export function applyFilters(offices: Office[], f: OfficeFilters): Office[] {
  const q = normalizeArabic(f.q);
  const result = offices.filter((o) => {
    if (q && !normalizeArabic(o.name).includes(q)) return false;
    if (f.city && o.city !== f.city) return false;
    if (f.status && o.status !== f.status) return false;
    if (f.minRating && (o.rating ?? 0) < f.minRating) return false;
    return true;
  });

  // فرز رقمي مع وضع القيم الفارغة في النهاية دائماً
  const by = (get: (o: Office) => number | null, dir: 1 | -1) => (a: Office, b: Office) => {
    const va = get(a);
    const vb = get(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va - vb) * dir;
  };

  switch (f.sort) {
    case "rating_desc":
      return result.sort(by((o) => o.rating, -1));
    case "rating_asc":
      return result.sort(by((o) => o.rating, 1));
    case "reviews_desc":
      return result.sort(by((o) => o.ratingCount, -1));
    case "reviews_asc":
      return result.sort(by((o) => o.ratingCount, 1));
    case "name":
      return result.sort((a, b) => a.name.localeCompare(b.name, "ar"));
    default:
      return result.sort((a, b) => b.id - a.id);
  }
}
