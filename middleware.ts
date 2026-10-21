import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function isAppHostname(hostname: string): boolean {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.endsWith(".vercel.app")) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      if (hostname === new URL(appUrl).hostname) return true;
    } catch {
      // malformed env var — fall through
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname;

  if (!isAppHostname(hostname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/by-domain";

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-original-host", hostname);

    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  const { supabaseResponse } = await updateSession(request);
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
