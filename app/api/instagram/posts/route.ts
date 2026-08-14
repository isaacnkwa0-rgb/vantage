import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("ig_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Not connected" }, { status: 401 });
  }

  const res = await fetch(
    `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_url,thumbnail_url,media_type,timestamp&limit=24&access_token=${token}`,
    { next: { revalidate: 0 } }
  );

  if (!res.ok) {
    const body = await res.text();
    console.error("Instagram media fetch failed:", body);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
