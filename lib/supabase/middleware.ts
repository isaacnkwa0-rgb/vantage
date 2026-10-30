import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
  return { supabaseResponse: NextResponse.next({ request }), user: session?.user ?? null };
}
