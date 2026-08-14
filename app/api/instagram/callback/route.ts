import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  const appId = process.env.INSTAGRAM_APP_ID!;
  const appSecret = process.env.INSTAGRAM_APP_SECRET!;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? request.nextUrl.origin;
  const redirectUri = `${siteUrl}/api/instagram/callback`;

  let slug = "";
  if (state) {
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
      slug = decoded.slug ?? "";
    } catch {}
  }

  const failUrl = slug ? `/${slug}/products?instagram_error=true` : "/";

  if (error || !code) {
    return NextResponse.redirect(new URL(failUrl, siteUrl));
  }

  // Exchange code for short-lived token
  const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL(failUrl, siteUrl));
  }

  const { access_token: shortToken } = await tokenRes.json();

  // Exchange for long-lived token (60-day expiry)
  const longRes = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortToken}`
  );

  const longData = await longRes.json();
  const token = longData.access_token ?? shortToken;

  const successUrl = new URL(`/${slug}/products?instagram=connected`, siteUrl);
  const response = NextResponse.redirect(successUrl);

  // Store token in HttpOnly cookie (1 hour — enough for import session)
  response.cookies.set("ig_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });

  return response;
}
