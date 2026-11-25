import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, renderTemplate } from "@/lib/whatsapp";
import { DEFAULT_TEMPLATE } from "@/lib/constants";

describe("renderTemplate", () => {
  it("يستبدل كل المتغيرات وكل تكراراتها", () => {
    const out = renderTemplate("مرحباً {اسم_المكتب} في {المدينة}، {اسم_المكتب}", {
      officeName: "مكتب الإنجاز",
      city: "جدة",
    });
    expect(out).toBe("مرحباً مكتب الإنجاز في جدة، مكتب الإنجاز");
  });

  it("القالب الافتراضي لا يبقى فيه أي متغير", () => {
    const out = renderTemplate(DEFAULT_TEMPLATE, { officeName: "مكتب س", city: "الرياض" });
    expect(out).not.toMatch(/\{(اسم_المكتب|المدينة)\}/);
    expect(out).toContain("مكتب مكتب س");
    expect(out).toContain("في الرياض");
  });

  it("لا يفسّر رموز الاستبدال الخاصة ($&) في اسم المكتب", () => {
    expect(renderTemplate("{اسم_المكتب}", { officeName: "A $& B", city: "" })).toBe("A $& B");
  });
});

describe("buildWhatsAppUrl", () => {
  it("يبني رابط wa.me مع ترميز الرسالة", () => {
    const url = buildWhatsAppUrl("966501234567", "السلام عليكم");
    expect(url).toBe(`https://wa.me/966501234567?text=${encodeURIComponent("السلام عليكم")}`);
    expect(decodeURIComponent(new URL(url).searchParams.get("text") ?? "")).toBe("السلام عليكم");
  });

  it("يرمّز الرموز الخاصة والأسطر الجديدة", () => {
    const msg = "سطر 1\nسطر 2 & ? # = mueqeb.com";
    const url = new URL(buildWhatsAppUrl("966501234567", msg));
    expect(url.hostname).toBe("wa.me");
    expect(url.pathname).toBe("/966501234567");
    expect(url.searchParams.get("text")).toBe(msg);
    expect(url.search).not.toContain(" ");
    expect(url.search).not.toContain("\n");
  });

  it("بلا رسالة لا يضيف text", () => {
    expect(buildWhatsAppUrl("966501234567", "")).toBe("https://wa.me/966501234567");
  });

  it("يرفض رقماً بصيغة غير دولية", () => {
    expect(() => buildWhatsAppUrl("+966501234567", "x")).toThrow();
    expect(() => buildWhatsAppUrl("050 123 4567", "x")).toThrow();
  });
});
