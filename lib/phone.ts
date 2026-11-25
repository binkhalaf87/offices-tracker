/**
 * تحويل أرقام الهواتف السعودية إلى الصيغة الدولية المطلوبة لروابط wa.me
 * (أرقام فقط، بلا + ولا أصفار بادئة): 9665XXXXXXXX.
 */

export type PhoneResult =
  | { ok: true; number: string }
  | { ok: false; reason: "missing" | "landline" | "foreign" | "invalid" };

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN = "۰۱۲۳۴۵۶۷۸۹";

function toAsciiDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const a = ARABIC_INDIC.indexOf(ch);
    return String(a >= 0 ? a : PERSIAN.indexOf(ch));
  });
}

/** يعيد الرقم بالأرقام فقط بعد توحيد البادئات، دون التحقق من صلاحيته. */
export function toInternationalDigits(raw: string): string {
  let digits = toAsciiDigits(raw).replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // 966 05XXXXXXXX (صفر زائد بعد رمز الدولة)
  if (digits.startsWith("9660")) digits = "966" + digits.slice(4);
  // 05XXXXXXXX أو 01XXXXXXX (محلي)
  else if (digits.startsWith("0")) digits = "966" + digits.slice(1);
  // 5XXXXXXXX (بلا صفر)
  else if (digits.length === 9 && digits.startsWith("5")) digits = "966" + digits;
  return digits;
}

export const SAUDI_MOBILE_RE = /^9665\d{8}$/;

export function normalizeSaudiMobile(raw: string | null | undefined): PhoneResult {
  if (!raw || !raw.trim()) return { ok: false, reason: "missing" };
  const digits = toInternationalDigits(raw);
  if (!digits) return { ok: false, reason: "missing" };
  if (SAUDI_MOBILE_RE.test(digits)) return { ok: true, number: digits };
  if (!digits.startsWith("966")) return { ok: false, reason: "foreign" };
  // 9665… بطول خاطئ = جوال ناقص/زائد. غير ذلك أرضي (9661…) أو موحّد (966920…) أو مجاني (966800…)
  if (digits.startsWith("9665") || digits.length < 11 || digits.length > 13) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: false, reason: "landline" };
}

/** يفضّل الرقم الدولي من Google ثم المحلي. */
export function pickMobile(international: string | null, national: string | null): PhoneResult {
  const first = normalizeSaudiMobile(international);
  if (first.ok) return first;
  const second = normalizeSaudiMobile(national);
  if (second.ok) return second;
  // إن لم يوجد أي رقم صالح نعيد السبب الأكثر فائدة
  if (first.reason !== "missing") return first;
  return second;
}
