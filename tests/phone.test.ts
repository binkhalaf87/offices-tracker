import { describe, expect, it } from "vitest";
import { normalizeSaudiMobile, pickMobile, toInternationalDigits } from "@/lib/phone";

describe("normalizeSaudiMobile", () => {
  it.each([
    ["0501234567", "966501234567"],
    ["050 123 4567", "966501234567"],
    ["050-123-4567", "966501234567"],
    ["(050) 123-4567", "966501234567"],
    ["+966 50 123 4567", "966501234567"],
    ["+966501234567", "966501234567"],
    ["00966501234567", "966501234567"],
    ["966501234567", "966501234567"],
    ["+966 050 123 4567", "966501234567"],
    ["501234567", "966501234567"],
    ["٠٥٠١٢٣٤٥٦٧", "966501234567"],
    ["۰۵۵۱۲۳۴۵۶۷", "966551234567"],
  ])("يحوّل %s إلى %s", (input, expected) => {
    expect(normalizeSaudiMobile(input)).toEqual({ ok: true, number: expected });
  });

  it("يرفض الرقم الفارغ", () => {
    expect(normalizeSaudiMobile("")).toEqual({ ok: false, reason: "missing" });
    expect(normalizeSaudiMobile(null)).toEqual({ ok: false, reason: "missing" });
    expect(normalizeSaudiMobile("   ")).toEqual({ ok: false, reason: "missing" });
    expect(normalizeSaudiMobile("---")).toEqual({ ok: false, reason: "missing" });
  });

  it("يرفض الأرقام الأرضية والموحّدة", () => {
    expect(normalizeSaudiMobile("011 234 5678")).toEqual({ ok: false, reason: "landline" });
    expect(normalizeSaudiMobile("+966 11 234 5678")).toEqual({ ok: false, reason: "landline" });
    expect(normalizeSaudiMobile("+966 920012345")).toEqual({ ok: false, reason: "landline" });
  });

  it("يرفض جوالاً بطول خاطئ", () => {
    expect(normalizeSaudiMobile("050123456")).toEqual({ ok: false, reason: "invalid" });
    expect(normalizeSaudiMobile("05012345678")).toEqual({ ok: false, reason: "invalid" });
  });

  it("يرفض الأرقام غير السعودية", () => {
    expect(normalizeSaudiMobile("+971 50 123 4567")).toEqual({ ok: false, reason: "foreign" });
    expect(normalizeSaudiMobile("+20 100 123 4567")).toEqual({ ok: false, reason: "foreign" });
  });

  it("الناتج دائماً 12 رقماً ويبدأ بـ 9665", () => {
    const r = normalizeSaudiMobile("0551234567");
    expect(r.ok && r.number).toMatch(/^9665\d{8}$/);
  });
});

describe("toInternationalDigits", () => {
  it("يزيل كل ما ليس رقماً", () => {
    expect(toInternationalDigits("+966 (55) 123-45.67")).toBe("966551234567");
  });
});

describe("pickMobile", () => {
  it("يفضّل الرقم الدولي", () => {
    expect(pickMobile("+966 55 111 2222", "050 999 8888")).toEqual({ ok: true, number: "966551112222" });
  });
  it("يرجع للرقم المحلي إن كان الدولي أرضياً", () => {
    expect(pickMobile("+966 11 234 5678", "050 999 8888")).toEqual({ ok: true, number: "966509998888" });
  });
  it("يعيد سبب الرفض المفيد", () => {
    expect(pickMobile("+966 11 234 5678", null)).toEqual({ ok: false, reason: "landline" });
    expect(pickMobile(null, null)).toEqual({ ok: false, reason: "missing" });
  });
});
