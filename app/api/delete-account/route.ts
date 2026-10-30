import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Delete user from Better Auth (cascades to sessions, accounts)
    await sql(`DELETE FROM "user" WHERE id = $1`, [session.user.id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
