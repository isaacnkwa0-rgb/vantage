import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/register", "/verify", "/invite"];
const AUTH_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";

  // Fast path: skip Supabase network call when no session cookie exists.
  // Supabase stores its session in a cookie containing "-auth-token".
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
    // Cookie present but invalid/expired.
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
