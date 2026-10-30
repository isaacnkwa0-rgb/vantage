/**
 * Server-side Supabase compatibility shim — backed by Neon + Better Auth.
 * All existing code that does `const supabase = await createClient()` works unchanged.
 */
import { auth } from "@/lib/auth";
import { createDbClient } from "@/lib/db";
import { headers } from "next/headers";
import { sql } from "@/lib/db";

export async function createClient() {
  const hdrs = await headers();
  const session = await auth.api.getSession({ headers: hdrs }).catch(() => null);
  const db = createDbClient();

  return {
    // ── Auth ────────────────────────────────────────────────────────────────
    auth: {
      getUser: async () => ({
        data: { user: session?.user ?? null },
        error: session ? null : { message: "Not authenticated" },
      }),
      getSession: async () => ({
        data: { session: session?.session ?? null, user: session?.user ?? null },
        error: null,
      }),
    },

    // ── Database ─────────────────────────────────────────────────────────────
    from: (table: string) => db.from(table),

    // ── RPC ──────────────────────────────────────────────────────────────────
    rpc: (fn: string, params?: Record<string, any>) => db.rpc(fn, params),
  };
}

/**
 * Service-role equivalent — bypasses session check, same DB access.
 * Used for admin operations like account deletion. Synchronous (no headers needed).
 */
export function createServiceClient() {
  const db = createDbClient();
  return {
    auth: {
      admin: {
        deleteUser: async (userId: string) => {
          try {
            // Delete the Better Auth user (cascades to sessions/accounts)
            await sql(`DELETE FROM "user" WHERE id = $1`, [userId]);
            return { error: null };
          } catch (err: any) {
            return { error: err };
          }
        },
      },
    },
    from: (table: string) => db.from(table),
    rpc: (fn: string, params?: Record<string, any>) => db.rpc(fn, params),
  };
}
