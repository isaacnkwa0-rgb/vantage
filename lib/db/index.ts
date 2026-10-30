import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
});

// Standard parameterized query helper (replaces Supabase's PostgREST calls)
export const sql = async (query: string, params: any[] = []): Promise<any[]> => {
  const { rows } = await pool.query(query, params);
  return rows;
};

// ── FK inference ──────────────────────────────────────────────────────────────
// Many-to-one: FK is on the SOURCE table pointing to the embed table
const FK_MAP: Record<string, string> = {
  businesses: "business_id",
  categories: "category_id",
  customers: "customer_id",
  products: "product_id",
  sales: "sale_id",
  suppliers: "supplier_id",
  locations: "location_id",
  staff: "staff_id",
  user: "user_id",
  profiles: "user_id",
  owner: "owner_id",
};

// One-to-many: FK is on the CHILD (embed) table pointing back to the source
// These return arrays via json_agg instead of single objects
const CHILD_FK_MAP: Record<string, string> = {
  sale_items:           "sale_id",
  invoice_items:        "invoice_id",
  quote_items:          "quote_id",
  purchase_order_items: "purchase_order_id",
  bundle_items:         "bundle_id",
  return_items:         "return_id",
  store_order_items:    "order_id",
  payroll_entries:      "payroll_run_id",
};

function getFkCol(embedTable: string): string {
  if (FK_MAP[embedTable]) return FK_MAP[embedTable];
  const singular = embedTable
    .replace(/ies$/, "y")
    .replace(/([^aeiou])es$/, "$1")
    .replace(/s$/, "");
  return `${singular}_id`;
}

// ── Select string parser ──────────────────────────────────────────────────────
function parseSelect(selectStr: string) {
  const mainCols: string[] = [];
  const embeds: Array<{ alias: string; table: string; cols: string[]; fkCol: string; isChild: boolean }> = [];

  const parts: string[] = [];
  let depth = 0, cur = "";
  for (const ch of selectStr) {
    if (ch === "(") { depth++; cur += ch; }
    else if (ch === ")") { depth--; cur += ch; }
    else if (ch === "," && depth === 0) { parts.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());

  for (const part of parts) {
    // Strip Supabase !inner / !left hints — just use the table name
    const m = part.match(/^(\w+)(?:![a-z]+)?\(([\s\S]+)\)$/);
    if (m) {
      const table = m[1];
      const isChild = table in CHILD_FK_MAP;
      const fkCol = isChild ? CHILD_FK_MAP[table] : getFkCol(table);
      embeds.push({ alias: table, table, cols: m[2].split(",").map((c) => c.trim()).filter(Boolean), fkCol, isChild });
    } else {
      mainCols.push(part);
    }
  }
  return { mainCols, embeds };
}

// ── Condition types ───────────────────────────────────────────────────────────
export type Condition =
  | { type: "op"; col: string; op: string; val: any }
  | { type: "in"; col: string; vals: any[] }
  | { type: "not_in"; col: string; vals: any[] }
  | { type: "is"; col: string; val: null | boolean }
  | { type: "null"; col: string; not: boolean }
  | { type: "ilike"; col: string; val: string }
  | { type: "like"; col: string; val: string }
  | { type: "or"; filters: string };

export type QuerySpec = {
  table: string;
  op: "select" | "insert" | "update" | "delete" | "upsert";
  selectStr: string;
  conditions: Condition[];
  orderCol?: string;
  orderAsc: boolean;
  limitN?: number;
  offsetN?: number;
  single: boolean;
  maybeSingle: boolean;
  data?: any;
  returning: boolean;
  returningCols: string;
  onConflict?: string;
  ignoreDuplicates: boolean;
  countOnly?: boolean;
};

// ── WHERE builder ─────────────────────────────────────────────────────────────
function buildWhere(table: string, conditions: Condition[], params: any[]): string {
  if (!conditions.length) return "";
  const p = (v: any) => { params.push(v); return `$${params.length}`; };

  const parts = conditions.map((c) => {
    if (c.type === "in") {
      if (!c.vals.length) return "FALSE";
      return `"${table}"."${c.col}" IN (${c.vals.map((v) => p(v)).join(", ")})`;
    }
    if (c.type === "not_in") {
      if (!c.vals.length) return "TRUE";
      return `"${table}"."${c.col}" NOT IN (${c.vals.map((v) => p(v)).join(", ")})`;
    }
    if (c.type === "is") {
      if (c.val === null) return `"${table}"."${c.col}" IS NULL`;
      return `"${table}"."${c.col}" IS ${c.val ? "TRUE" : "FALSE"}`;
    }
    if (c.type === "null") return `"${table}"."${c.col}" IS ${c.not ? "NOT NULL" : "NULL"}`;
    if (c.type === "ilike") return `"${table}"."${c.col}" ILIKE ${p(c.val)}`;
    if (c.type === "like") return `"${table}"."${c.col}" LIKE ${p(c.val)}`;
    if (c.type === "or") return `(${c.filters})`;
    return `"${table}"."${c.col}" ${c.op} ${p(c.val)}`;
  });

  return "WHERE " + parts.join(" AND ");
}

// ── Core executor ─────────────────────────────────────────────────────────────
export async function executeSpec(spec: QuerySpec): Promise<{ data: any; error: any; count?: number }> {
  try {
    const params: any[] = [];
    const p = (v: any) => { params.push(v); return `$${params.length}`; };
    let query: string;

    if (spec.op === "select" && spec.countOnly) {
      const where = buildWhere(spec.table, spec.conditions, params);
      const cq = `SELECT COUNT(*)::int AS count FROM "${spec.table}" ${where}`;
      const rows = (await sql(cq, params)) as any[];
      return { data: null, error: null, count: rows[0]?.count ?? 0 };
    }

    if (spec.op === "select") {
      const { mainCols, embeds } = parseSelect(spec.selectStr);
      const selectParts: string[] = [];
      const joinClauses: string[] = [];

      if (!mainCols.length && embeds.length) {
        selectParts.push(`"${spec.table}".*`);
      } else {
        for (const col of mainCols) {
          selectParts.push(col === "*" ? `"${spec.table}".*` : `"${spec.table}"."${col}"`);
        }
      }

      let hasChildEmbed = false;
      for (const embed of embeds) {
        if (embed.isChild) {
          // One-to-many: FK is on child table → use json_agg + GROUP BY
          hasChildEmbed = true;
          joinClauses.push(`LEFT JOIN "${embed.table}" ON "${embed.table}"."${embed.fkCol}" = "${spec.table}"."id"`);
          const cols = embed.cols[0] === "*"
            ? `"${embed.table}".*`
            : embed.cols.map((c) => `'${c}', "${embed.table}"."${c}"`).join(", ");
          const agg = embed.cols[0] === "*"
            ? `row_to_json("${embed.table}".*)`
            : `json_build_object(${cols})`;
          selectParts.push(`COALESCE(json_agg(${agg}) FILTER (WHERE "${embed.table}"."id" IS NOT NULL), '[]'::json) AS "${embed.alias}"`);
        } else {
          // Many-to-one: FK is on source table → single JSON object
          joinClauses.push(`LEFT JOIN "${embed.table}" ON "${spec.table}"."${embed.fkCol}" = "${embed.table}"."id"`);
          const args = embed.cols.map((c) => `'${c}', "${embed.table}"."${c}"`).join(", ");
          selectParts.push(`CASE WHEN "${embed.table}"."id" IS NULL THEN NULL ELSE json_build_object(${args}) END AS "${embed.alias}"`);
        }
      }

      const where = buildWhere(spec.table, spec.conditions, params);
      query = `SELECT ${selectParts.join(", ")} FROM "${spec.table}"`;
      if (joinClauses.length) query += " " + joinClauses.join(" ");
      if (where) query += " " + where;
      if (hasChildEmbed) {
        // GROUP BY all selected non-aggregate columns from source table
        const groupCols = mainCols.length
          ? mainCols.map((c) => c === "*" ? `"${spec.table}"."id"` : `"${spec.table}"."${c}"`).join(", ")
          : `"${spec.table}"."id"`;
        query += ` GROUP BY ${groupCols}`;
      }
      if (spec.orderCol) query += ` ORDER BY "${spec.table}"."${spec.orderCol}" ${spec.orderAsc ? "ASC" : "DESC"}`;
      if (spec.limitN != null) query += ` LIMIT ${spec.limitN}`;
      if (spec.offsetN != null) query += ` OFFSET ${spec.offsetN}`;

    } else if (spec.op === "insert" || spec.op === "upsert") {
      const records = spec.data as object[];
      if (!records?.length) return { data: [], error: null };

      const keys = Object.keys(records[0]);
      const cols = keys.map((k) => `"${k}"`).join(", ");
      const rows = records.map((r) => `(${keys.map((k) => p((r as any)[k])).join(", ")})`).join(", ");

      query = `INSERT INTO "${spec.table}" (${cols}) VALUES ${rows}`;

      if (spec.op === "upsert") {
        if (spec.onConflict) {
          if (spec.ignoreDuplicates) {
            query += ` ON CONFLICT (${spec.onConflict}) DO NOTHING`;
          } else {
            const sets = keys.filter((k) => k !== "id").map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ");
            query += ` ON CONFLICT (${spec.onConflict}) DO UPDATE SET ${sets}`;
          }
        } else if (keys.includes("id")) {
          const sets = keys.filter((k) => k !== "id").map((k) => `"${k}" = EXCLUDED."${k}"`).join(", ");
          query += sets ? ` ON CONFLICT (id) DO UPDATE SET ${sets}` : ` ON CONFLICT (id) DO NOTHING`;
        } else {
          query += ` ON CONFLICT DO NOTHING`;
        }
      }

      if (spec.returning) {
        const ret = spec.returningCols === "*" ? "*" : spec.returningCols.split(",").map((c) => `"${c.trim()}"`).join(", ");
        query += ` RETURNING ${ret}`;
      }

    } else if (spec.op === "update") {
      const sets = Object.entries(spec.data as object).map(([k, v]) => `"${k}" = ${p(v)}`).join(", ");
      const where = buildWhere(spec.table, spec.conditions, params);
      query = `UPDATE "${spec.table}" SET ${sets}`;
      if (where) query += " " + where;
      if (spec.returning) {
        const ret = spec.returningCols === "*" ? "*" : spec.returningCols.split(",").map((c) => `"${c.trim()}"`).join(", ");
        query += ` RETURNING ${ret}`;
      }

    } else {
      const where = buildWhere(spec.table, spec.conditions, params);
      query = `DELETE FROM "${spec.table}"`;
      if (where) query += " " + where;
      if (spec.returning) query += " RETURNING *";
    }

    const rows = (await sql(query, params)) as any[];

    if (spec.op === "select") {
      if (spec.single || spec.maybeSingle) {
        const data = rows[0] ?? null;
        if (spec.single && !data) return { data: null, error: { message: "Row not found", code: "PGRST116" } };
        return { data, error: null };
      }
      return { data: rows, error: null };
    }

    if (spec.returning) {
      const data = spec.single || spec.maybeSingle ? rows[0] ?? null : rows;
      return { data, error: null };
    }
    return { data: null, error: null };

  } catch (err: any) {
    console.error("[db]", err.message ?? err);
    return { data: null, error: err };
  }
}

// ── Query builder ─────────────────────────────────────────────────────────────
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

export class NeonQueryBuilder {
  protected _spec: QuerySpec;

  constructor(table: string) {
    this._spec = defaultSpec(table);
  }

  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    if (opts?.head) this._spec.countOnly = true;
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
    if (op === "is" && val === null) {
      this._spec.conditions.push({ type: "null", col, not: true });
    } else if (op === "in" && Array.isArray(val)) {
      this._spec.conditions.push({ type: "not_in", col, vals: val });
    } else {
      this._spec.conditions.push({ type: "op", col, op: `NOT ${op.toUpperCase()}`, val });
    }
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

  then<R1 = { data: any; error: any; count?: number }, R2 = never>(
    onfulfilled?: ((v: { data: any; error: any; count?: number }) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((r: any) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return executeSpec(this._spec).then(onfulfilled, onrejected);
  }

  catch<R = never>(fn?: ((r: any) => R | PromiseLike<R>) | null) {
    return executeSpec(this._spec).catch(fn);
  }

  finally(fn?: (() => void) | null) {
    return executeSpec(this._spec).finally(fn);
  }

  getSpec(): QuerySpec { return this._spec; }
}

// ── Server-side db client factory ─────────────────────────────────────────────
export function createDbClient() {
  return {
    from(table: string) {
      return new NeonQueryBuilder(table);
    },
    async rpc(fn: string, params: Record<string, any> = {}) {
      try {
        const args = Object.entries(params)
          .map(([k, v]) => `${k} => '${String(v).replace(/'/g, "''")}'`)
          .join(", ");
        const rows = (await sql(`SELECT * FROM ${fn}(${args})`)) as any[];
        return { data: rows, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    },
  };
}
