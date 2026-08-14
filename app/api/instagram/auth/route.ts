import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "Instagram not configured" }, { status: 503 });
  }

  const slug = request.nextUrl.searchParams.get("slug") ?? "";
  const state = Buffer.from(JSON.stringify({ slug, ts: Date.now() })).toString("base64url");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const redirectUri = `${siteUrl}/api/instagram/callback`;

  const authUrl = new URL("https://www.instagram.com/oauth/authorize");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "instagram_business_basic");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
