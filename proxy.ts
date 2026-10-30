import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = [
  "/", "/login", "/register", "/forgot-password", "/reset-password",
  "/auth", "/onboarding/verify", "/terms", "/privacy",
  "/store", "/by-domain", "/pay", "/portal",
  "/api/auth", "/api/store", "/api/instagram/callback", "/api/pay",
];

const AUTH_PATHS = ["/login", "/register"];

// Set STORE_DOMAIN to your platform domain, e.g. "stokka.shop"
const STORE_DOMAIN = process.env.STORE_DOMAIN ?? "";
const APP_HOSTNAME = process.env.APP_HOSTNAME ?? "";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // ── Branded subdomain: zikkygadgets.stokka.shop ───────────────────────────
  if (STORE_DOMAIN && hostname.endsWith(`.${STORE_DOMAIN}`)) {
    const slug = hostname.slice(0, hostname.length - STORE_DOMAIN.length - 1);
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/store/${slug}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Custom domain: shop.yourbusiness.com ──────────────────────────────────
  const isMainHost =
    !hostname ||
    hostname.startsWith("localhost") ||
    hostname.endsWith(".vercel.app") ||
    (APP_HOSTNAME && hostname === APP_HOSTNAME);

  if (!isMainHost && !(STORE_DOMAIN && hostname === STORE_DOMAIN)) {
    const url = request.nextUrl.clone();
    url.pathname = "/by-domain";
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-original-host", hostname);
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // ── Standard app routing ──────────────────────────────────────────────────
  // Allow static assets and explicitly public paths through immediately
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return NextResponse.next();
  }

  // Fast session check via cookie — no DB round-trip
  const session = getSessionCookie(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged-in user visiting an auth page → send to dashboard
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
