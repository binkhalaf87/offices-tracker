export const TEMPLATE_VARS = {
  officeName: "{اسم_المكتب}",
  city: "{المدينة}",
} as const;

export function renderTemplate(template: string, vars: { officeName: string; city: string }): string {
  return template
    .split(TEMPLATE_VARS.officeName)
    .join(vars.officeName.trim())
    .split(TEMPLATE_VARS.city)
    .join(vars.city.trim());
}

/** يبني رابط wa.me. الرقم يجب أن يكون أرقاماً فقط بالصيغة الدولية. */
export function buildWhatsAppUrl(internationalNumber: string, message: string): string {
  if (!/^\d{8,15}$/.test(internationalNumber)) {
    throw new Error("رقم غير صالح لرابط واتساب");
  }
  const base = `https://wa.me/${internationalNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
