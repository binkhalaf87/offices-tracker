/**
 * كوكي جلسة موقّع بـ HMAC-SHA256 (Web Crypto — يعمل في middleware وفي Node).
 * مفتاح التوقيع مشتق من APP_PASSWORD، فتغيير كلمة المرور يُبطل كل الجلسات.
 */

export const SESSION_COOKIE = "ot_session";
export const SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;
const VERSION = "v1";

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let bin = "";
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`offices-tracker:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toBase64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

/** مقارنة بزمن ثابت لنصين. */
export function safeEqual(a: string, b: string): boolean {
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  let diff = ab.length ^ bb.length;
  const len = Math.max(ab.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export async function createSessionToken(secret: string, now: number = Date.now()): Promise<string> {
  const exp = Math.floor(now / 1000) + SESSION_MAX_AGE_S;
  const payload = `${VERSION}.${exp}`;
  return `${payload}.${await hmac(secret, payload)}`;
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== VERSION) return false;
  const exp = Number(parts[1]);
  if (!Number.isInteger(exp) || exp * 1000 < now) return false;
  const expected = await hmac(secret, `${parts[0]}.${parts[1]}`);
  return safeEqual(parts[2], expected);
}
