import { describe, expect, it } from "vitest";
import {
  applyContact,
  canContact,
  checkDailyLimit,
  endOfRiyadhDay,
  riyadhDayKey,
  type ContactableOffice,
} from "@/lib/outreach";

const base: ContactableOffice = {
  status: "not_contacted",
  internationalPhone: "+966 50 123 4567",
  nationalPhone: "050 123 4567",
  contactCount: 0,
  nextFollowupAt: null,
};
const NOW = new Date("2026-11-25T10:00:00Z");

describe("checkDailyLimit", () => {
  it("يسمح تحت الحد", () => {
    expect(checkDailyLimit(0, 25)).toEqual({ allowed: true, remaining: 25 });
    expect(checkDailyLimit(24, 25)).toEqual({ allowed: true, remaining: 1 });
  });
  it("يمنع عند بلوغ الحد وبعده", () => {
    expect(checkDailyLimit(25, 25)).toEqual({ allowed: false, remaining: 0 });
    expect(checkDailyLimit(30, 25)).toEqual({ allowed: false, remaining: 0 });
  });
  it("حد غير صالح يمنع كل شيء", () => {
    expect(checkDailyLimit(0, 0).allowed).toBe(false);
    expect(checkDailyLimit(0, Number.NaN).allowed).toBe(false);
    expect(checkDailyLimit(0, -5).allowed).toBe(false);
  });
});

describe("riyadhDayKey", () => {
  it("يتبع توقيت الرياض لا UTC", () => {
    // 21:30 UTC = 00:30 بتوقيت الرياض في اليوم التالي
    expect(riyadhDayKey(new Date("2026-11-25T21:30:00Z"))).toBe("2026-11-26");
    expect(riyadhDayKey(new Date("2026-11-25T20:59:00Z"))).toBe("2026-11-25");
  });
  it("نهاية اليوم بتوقيت الرياض", () => {
    expect(endOfRiyadhDay(NOW).toISOString()).toBe("2026-11-25T20:59:59.999Z");
  });
});

describe("canContact", () => {
  const ctx = { countToday: 0, dailyLimit: 25, now: NOW };

  it("يسمح لمكتب جديد برقم صالح", () => {
    expect(canContact(base, ctx)).toEqual({ ok: true, number: "966501234567", isFollowup: false });
  });

  it("يمنع عند بلوغ الحد اليومي", () => {
    const r = canContact(base, { ...ctx, countToday: 25 });
    expect(r).toEqual({ ok: false, block: { kind: "daily_limit", limit: 25 } });
  });

  it.each(["refused", "do_not_contact", "registered"] as const)("يمنع الحالة %s", (status) => {
    const r = canContact({ ...base, status }, ctx);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.block.kind).toBe("status");
  });

  it("يمنع الرقم غير الصالح مع السبب", () => {
    const r = canContact({ ...base, internationalPhone: "+966 11 234 5678", nationalPhone: null }, ctx);
    expect(r).toEqual({ ok: false, block: { kind: "phone", reason: "landline" } });
  });

  it("يمنع المتابعة قبل موعدها", () => {
    const r = canContact(
      { ...base, status: "contacted", contactCount: 1, nextFollowupAt: "2026-11-26T10:00:00Z" },
      ctx,
    );
    expect(r.ok).toBe(false);
    expect(!r.ok && r.block.kind).toBe("followup_not_due");
  });

  it("يسمح بمتابعة واحدة عند حلول موعدها", () => {
    const r = canContact(
      { ...base, status: "contacted", contactCount: 1, nextFollowupAt: "2026-11-25T09:00:00Z" },
      ctx,
    );
    expect(r).toEqual({ ok: true, number: "966501234567", isFollowup: true });
  });

  it("يمنع المتابعة الثانية", () => {
    const r = canContact({ ...base, status: "contacted", contactCount: 2 }, ctx);
    expect(r).toEqual({ ok: false, block: { kind: "followup_used" } });
  });

  it("يسمح بإكمال المحادثة مع من ردّ دون قاعدة المتابعة", () => {
    const r = canContact({ ...base, status: "interested", contactCount: 2 }, ctx);
    expect(r.ok).toBe(true);
  });
});

describe("applyContact", () => {
  it("الرسالة الأولى: تمت المراسلة + متابعة بعد يومين", () => {
    expect(applyContact(base, NOW)).toEqual({
      status: "contacted",
      contactCount: 1,
      lastContactAt: NOW.toISOString(),
      nextFollowupAt: "2026-11-27T10:00:00.000Z",
    });
  });

  it("المتابعة: لا موعد متابعة بعدها", () => {
    const u = applyContact({ ...base, status: "contacted", contactCount: 1 }, NOW);
    expect(u.contactCount).toBe(2);
    expect(u.nextFollowupAt).toBeNull();
  });

  it("لا يغيّر حالة من ردّ", () => {
    const u = applyContact({ ...base, status: "replied", contactCount: 1, nextFollowupAt: null }, NOW);
    expect(u.status).toBe("replied");
    expect(u.contactCount).toBe(1);
  });
});
