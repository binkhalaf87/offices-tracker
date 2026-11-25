export const STATUSES = [
  "not_contacted",
  "contacted",
  "replied",
  "interested",
  "registered",
  "refused",
  "do_not_contact",
] as const;

export type OfficeStatus = (typeof STATUSES)[number];

/** الحالات التي يُعطَّل فيها زر واتساب نهائياً. */
export const BLOCKED_STATUSES: readonly OfficeStatus[] = ["refused", "do_not_contact", "registered"];

/** حالات «التواصل الأولي»: تنطبق عليها قاعدة متابعة واحدة فقط. */
export const OUTREACH_STATUSES: readonly OfficeStatus[] = ["not_contacted", "contacted"];

/** كل من ردّ بأي شكل (يُستخدم لحساب نسبة الرد). */
export const RESPONDED_STATUSES: readonly OfficeStatus[] = ["replied", "interested", "registered", "refused"];

export function isOfficeStatus(value: unknown): value is OfficeStatus {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export type City = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export const CITIES: readonly City[] = [
  { id: "riyadh", name: "الرياض", lat: 24.7136, lng: 46.6753 },
  { id: "jeddah", name: "جدة", lat: 21.5433, lng: 39.1728 },
  { id: "dammam", name: "الدمام", lat: 26.4207, lng: 50.0888 },
  { id: "makkah", name: "مكة", lat: 21.3891, lng: 39.8579 },
  { id: "madinah", name: "المدينة", lat: 24.5247, lng: 39.5692 },
  { id: "khobar", name: "الخبر", lat: 26.2172, lng: 50.1971 },
  { id: "abha", name: "أبها", lat: 18.2164, lng: 42.5053 },
  { id: "tabuk", name: "تبوك", lat: 28.3835, lng: 36.5662 },
  { id: "qassim", name: "القصيم", lat: 26.3592, lng: 43.9818 },
  { id: "hail", name: "حائل", lat: 27.5114, lng: 41.69 },
];

export function findCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

export const DEFAULT_SEARCH_PHRASES = ["مكتب خدمات عامة", "معقب", "مكتب تعقيب", "خدمات عامة وتعقيب"];

/** Text Search يعيد 20 نتيجة لكل صفحة، وبحد أقصى 3 صفحات (60 نتيجة) لكل عبارة. */
export const RESULTS_PER_PAGE = 20;
export const MAX_PAGES_PER_PHRASE = 3;

/** نصف قطر انحياز الموقع حول مركز المدينة (الحد الأقصى المسموح 50 كم). */
export const LOCATION_BIAS_RADIUS_M = 30000;

export const DEFAULT_DAILY_LIMIT = 25;
export const MAX_DAILY_LIMIT = 200;
export const FOLLOWUP_DELAY_DAYS = 2;
/** رسالة أولى + متابعة واحدة فقط. */
export const MAX_OUTREACH_CONTACTS = 2;
/** نعرض تنبيهاً إذا مرّ على بيانات Google المخزّنة أكثر من هذا. */
export const STALE_DATA_DAYS = 30;

export const DEFAULT_TEMPLATE =
  "السلام عليكم، معكم [اسمك] من منصة مُعقّب. نربط المنشآت بمكاتب خدمات عامة موثّقة في {المدينة}. " +
  "تسجيل مكتب {اسم_المكتب} مجاني، وتصلكم الطلبات جاهزة، ومستحقاتكم محفوظة من لحظة دفع العميل. " +
  "هل يناسبكم اتصال قصير أشرح فيه الفكرة؟ mueqeb.com\n" +
  "وإذا ما تبغون نتواصل معكم مرة ثانية أخبرونا.";

export const TIME_ZONE = "Asia/Riyadh";
