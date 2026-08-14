import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/register", "/verify", "/invite", "/pricing", "/pay", "/portal", "/store", "/by-domain", "/api/store", "/api/sys-mig-9f3j7"];
const AUTH_PATHS = ["/login", "/register"];

// Set STORE_DOMAIN to your platform domain, e.g. "getvantage.app"
// Branded subdomains (zikkygadgets.getvantage.app) will then route automatically.
const STORE_DOMAIN = process.env.STORE_DOMAIN ?? "";

// The main app hostname (used to distinguish custom domains from the app itself).
// Set APP_HOSTNAME to e.g. "vantage-mu-ten.vercel.app" or your future app domain.
const APP_HOSTNAME = process.env.APP_HOSTNAME ?? "";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";

  // ── Branded subdomain: zikkygadgets.getvantage.app ──────────────────────
  // When STORE_DOMAIN is configured, any subdomain of it serves that store.
  if (STORE_DOMAIN && hostname.endsWith(`.${STORE_DOMAIN}`)) {
    const slug = hostname.slice(0, hostname.length - STORE_DOMAIN.length - 1);
    if (slug) {
      const url = request.nextUrl.clone();
      const storePath = url.pathname === "/" ? "" : url.pathname;
      url.pathname = `/store/${slug}${storePath}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Custom domain: shop.yourbusiness.com ─────────────────────────────────
  // Any request that isn't to the main app hostname (and isn't localhost/Vercel
  // preview) gets routed to the custom-domain resolver which looks up the
  // business by its stored custom_domain value.
  const isMainHost =
    !hostname ||
    hostname.startsWith("localhost") ||
    hostname.endsWith(".vercel.app") ||
    (APP_HOSTNAME && hostname === APP_HOSTNAME);

  const isStoreDomainApex = STORE_DOMAIN && hostname === STORE_DOMAIN;

  if (!isMainHost && !isStoreDomainApex) {
    const url = request.nextUrl.clone();
    url.pathname = "/by-domain";
    const res = NextResponse.rewrite(url);
    res.headers.set("x-original-host", hostname);
    return res;
  }

  // ── Standard app routing ─────────────────────────────────────────────────
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";

  // Fast path: skip Supabase network call when no session cookie exists.
  const hasSessionCookie = request.cookies
    .getAll()
    .some((c) => c.name.includes("-auth-token"));

  if (!hasSessionCookie) {
    if (isPublic || isRoot) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Session cookie exists — validate with Supabase and handle routing.
  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user) {
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Logged-in user visiting auth page or root → send to dashboard.
  if (isAuthPath || isRoot) {
    const { data: membership } = await supabase
      .from("business_members")
      .select("businesses!inner(slug)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const slug = (
      membership?.businesses as unknown as { slug: string } | null
    )?.slug;
    const url = request.nextUrl.clone();
    url.pathname = slug ? `/${slug}/dashboard` : "/onboarding";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
