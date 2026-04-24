import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/register", "/verify", "/invite"];
const AUTH_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always refresh session
  const { supabaseResponse, user, supabase } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isRoot = pathname === "/";

  // Not logged in → redirect to login
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in + visiting auth pages → redirect to app
  if (user && isAuthPath) {
    const { data: membership } = await supabase
      .from("business_members")
      .select("businesses!inner(slug)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const slug = (membership?.businesses as unknown as { slug: string } | null)?.slug;
    const url = request.nextUrl.clone();
    url.pathname = slug ? `/${slug}/dashboard` : "/onboarding";
    return NextResponse.redirect(url);
  }

  // Root redirect
  if (user && isRoot) {
    const { data: membership } = await supabase
      .from("business_members")
      .select("businesses!inner(slug)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    const slug = (membership?.businesses as unknown as { slug: string } | null)?.slug;
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
