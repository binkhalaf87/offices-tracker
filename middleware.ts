import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_PATHS = new Set(["/login", "/api/login"]);
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // حماية من الطلبات عبر المواقع: أي طلب معدِّل يجب أن يأتي من نفس الأصل
  if (!SAFE_METHODS.has(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: "طلب من مصدر غير مسموح" }, { status: 403 });
    }
  }

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const ok = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value, process.env.APP_PASSWORD);
  if (ok) return NextResponse.next();

  if (isApi) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  if (pathname !== "/") url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
