import { NextResponse } from "next/server";
import { createSessionToken, safeEqual, SESSION_COOKIE, SESSION_MAX_AGE_S } from "@/lib/session";
import { jsonError, readJson } from "@/lib/http";
import { t } from "@/lib/messages";

export const dynamic = "force-dynamic";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const secret = process.env.APP_PASSWORD;
  if (!secret) return jsonError(t.login.notConfigured, 500);

  const body = await readJson<{ password?: unknown }>(req);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!safeEqual(password, secret)) {
    // إبطاء بسيط لتخمين كلمة المرور
    await sleep(1000);
    return jsonError(t.login.wrong, 401);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSessionToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
