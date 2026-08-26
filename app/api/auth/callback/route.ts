import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/onboarding";

  console.log("[auth/callback] code:", code ? "present" : "missing", "next:", next, "origin:", origin);

  if (code) {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    console.log("[auth/callback] cookies:", allCookies.map(c => c.name));

    const redirectUrl = `${origin}${next}`;
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options as any);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("[auth/callback] exchange error:", error?.message ?? "none");
    if (!error) return response;

    console.log("[auth/callback] exchange failed, redirecting to login");
  } else {
    console.log("[auth/callback] no code in request, URL:", request.url);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
