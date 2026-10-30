/**
 * Browser-side Supabase compatibility shim — backed by Better Auth + /api/db proxy.
 * Auth calls go directly to Better Auth. DB calls route through /api/db (session-validated).
 */
import { authClient } from "@/lib/auth-client";
import type { QuerySpec, Condition } from "@/lib/db";

// ── Browser query builder ─────────────────────────────────────────────────────
function defaultSpec(table: string): QuerySpec {
  return {
    table,
    op: "select",
    selectStr: "*",
    conditions: [],
    orderAsc: true,
    single: false,
    maybeSingle: false,
    returning: false,
    returningCols: "*",
    ignoreDuplicates: false,
  };
}

class BrowserQueryBuilder {
  private _spec: QuerySpec;

  constructor(table: string) {
    this._spec = defaultSpec(table);
  }

  select(cols = "*") {
    if (this._spec.op === "select") {
      this._spec.selectStr = cols;
    } else {
      this._spec.returning = true;
      this._spec.returningCols = cols;
    }
    return this;
  }

  insert(data: object | object[]) {
    this._spec.op = "insert";
    this._spec.data = Array.isArray(data) ? data : [data];
    return this;
  }

  upsert(data: object | object[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
    this._spec.op = "upsert";
    this._spec.data = Array.isArray(data) ? data : [data];
    this._spec.onConflict = opts?.onConflict;
    this._spec.ignoreDuplicates = opts?.ignoreDuplicates ?? false;
    return this;
  }

  update(data: object) { this._spec.op = "update"; this._spec.data = data; return this; }
  delete() { this._spec.op = "delete"; return this; }

  eq(col: string, val: any) { this._spec.conditions.push({ type: "op", col, op: "=", val }); return this; }
  neq(col: string, val: any) { this._spec.conditions.push({ type: "op", col, op: "!=", val }); return this; }
  gt(col: string, val: any) { this._spec.conditions.push({ type: "op", col, op: ">", val }); return this; }
  gte(col: string, val: any) { this._spec.conditions.push({ type: "op", col, op: ">=", val }); return this; }
  lt(col: string, val: any) { this._spec.conditions.push({ type: "op", col, op: "<", val }); return this; }
  lte(col: string, val: any) { this._spec.conditions.push({ type: "op", col, op: "<=", val }); return this; }
  like(col: string, val: string) { this._spec.conditions.push({ type: "like", col, val }); return this; }
  ilike(col: string, val: string) { this._spec.conditions.push({ type: "ilike", col, val }); return this; }
  in(col: string, vals: any[]) { this._spec.conditions.push({ type: "in", col, vals }); return this; }
  is(col: string, val: null | boolean) { this._spec.conditions.push({ type: "is", col, val }); return this; }
  not(col: string, op: string, val?: any) {
    if (op === "is" && val === null) this._spec.conditions.push({ type: "null", col, not: true });
    else if (op === "in" && Array.isArray(val)) this._spec.conditions.push({ type: "not_in", col, vals: val });
    else this._spec.conditions.push({ type: "op", col, op: `NOT ${op.toUpperCase()}`, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._spec.orderCol = col;
    this._spec.orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) { this._spec.limitN = n; return this; }
  range(from: number, to: number) { this._spec.offsetN = from; this._spec.limitN = to - from + 1; return this; }
  single() { this._spec.single = true; this._spec.limitN = 1; return this; }
  maybeSingle() { this._spec.maybeSingle = true; this._spec.limitN = 1; return this; }
  throwOnError() { return this; }

  private async _execute(): Promise<{ data: any; error: any }> {
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this._spec),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        return { data: null, error: err.error ?? err };
      }
      return res.json();
    } catch (err: any) {
      return { data: null, error: err };
    }
  }

  then<R1 = { data: any; error: any }, R2 = never>(
    onfulfilled?: ((v: { data: any; error: any }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((r: any) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return this._execute().then(onfulfilled, onrejected);
  }

  catch<R = never>(fn?: ((r: any) => R | PromiseLike<R>) | null) {
    return this._execute().catch(fn);
  }

  finally(fn?: (() => void) | null) {
    return this._execute().finally(fn);
  }
}

// ── Realtime stub (keeps existing code from crashing; realtime is a later phase) ──
function makeChannel() {
  return {
    on: () => makeChannel(),
    subscribe: () => ({ unsubscribe: () => {} }),
  };
}

// ── Auth shim (maps Supabase auth API → Better Auth client) ───────────────────
const authShim = {
  getUser: async () => {
    const { data: session } = await authClient.getSession();
    return { data: { user: session?.user ?? null }, error: null };
  },
  getSession: async () => {
    const { data: session } = await authClient.getSession();
    return { data: { session: session?.session ?? null, user: session?.user ?? null }, error: null };
  },
  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const { data, error } = await authClient.signIn.email({ email, password });
    return { data: { user: (data as any)?.user ?? null, session: (data as any)?.session ?? null }, error };
  },
  signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: { full_name?: string }; emailRedirectTo?: string } }) => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: options?.data?.full_name ?? "",
      callbackURL: options?.emailRedirectTo,
    });
    return { data: { user: (data as any)?.user ?? null, session: (data as any)?.session ?? null }, error };
  },
  signInWithOAuth: async ({ provider, options }: { provider: string; options?: { redirectTo?: string } }) => {
    await authClient.signIn.social({
      provider: provider as any,
      callbackURL: options?.redirectTo ?? "/",
    });
    return { data: null, error: null };
  },
  signOut: async () => {
    await authClient.signOut();
    return { error: null };
  },
  resetPasswordForEmail: async (email: string, options?: { redirectTo?: string }) => {
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: options?.redirectTo ?? "/reset-password",
    });
    return { error };
  },
  updateUser: async ({ password }: { password?: string; data?: any }) => {
    if (password) {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token") ?? "";
      const { error } = await authClient.resetPassword({ newPassword: password, token });
      return { error };
    }
    return { error: null };
  },
  onAuthStateChange: (cb: (event: string, session: any) => void) => {
    // Lightweight stub — components using this need separate migration
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};

// ── Storage stub ──────────────────────────────────────────────────────────────
const storageStub = {
  from: (_bucket: string) => ({
    upload: async (_path: string, _file: any, _opts?: any) => ({ data: null, error: new Error("Storage: migrate to Uploadthing — see MIGRATION.md") }),
    download: async (_path: string) => ({ data: null, error: new Error("Storage: not migrated yet") }),
    remove: async (_paths: string[]) => ({ data: null, error: null }),
    getPublicUrl: (_path: string) => ({ data: { publicUrl: "" } }),
  }),
};

// ── Main factory ──────────────────────────────────────────────────────────────
export function createClient() {
  return {
    auth: authShim,
    from: (table: string) => new BrowserQueryBuilder(table),
    channel: (_name: string) => makeChannel(),
    removeChannel: (_ch: any) => {},
    storage: storageStub,
    rpc: async (fn: string, params?: Record<string, any>) => {
      const res = await fetch("/api/db/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fn, params }),
      });
      return res.ok ? res.json() : { data: null, error: await res.json() };
    },
  };
}
