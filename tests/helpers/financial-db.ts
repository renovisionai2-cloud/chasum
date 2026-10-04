/** Stateful PostgREST-shaped fake: returning rows, predicates, and atomic updates. No network. */
export type Row = Record<string, unknown>;
export type Query = { table: string; operation: "select" | "insert" | "update"; filters: [string, unknown][]; returning: boolean; payload?: Row };
export type Fault = (query: Query) => "error" | "zero" | "throw" | undefined;

export function financialDb(seed: Record<string, Row[]>, fault?: Fault) {
  const rows = structuredClone(seed);
  const calls: Query[] = [];
  let serial = 0;
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: "actor" } } }) },
    from(table: string) {
      const q: Query = { table, operation: "select", filters: [], returning: false };
      let single = false;
      const execute = () => {
        calls.push(structuredClone(q));
        const failure = fault?.(q);
        if (failure === "throw") throw new Error("Synthetic database throw");
        if (failure === "error") return { data: null, error: { message: "Synthetic query failure" } };
        if (failure === "zero") return { data: single ? null : [], error: null };
        const source = rows[table] ??= [];
        let matching = source.filter(row => q.filters.every(([key, value]) => row[key] === value));
        if (q.operation === "insert") {
          const row = { id: `new-${++serial}`, created_at: "2026-10-04T12:00:00Z", ...q.payload };
          source.push(row);
          matching = [row];
        } else if (q.operation === "update") {
          for (const row of matching) Object.assign(row, q.payload);
        }
        const data = q.operation === "select" || q.returning
          ? structuredClone(single ? matching[0] ?? null : matching) : null;
        return { data, error: null };
      };
      const query = {
        select: () => { q.returning = true; return query; },
        insert: (payload: Row) => { q.operation = "insert"; q.payload = payload; return query; },
        update: (payload: Row) => { q.operation = "update"; q.payload = payload; return query; },
        eq: (key: string, value: unknown) => { q.filters.push([key, value]); return query; },
        order: () => query,
        limit: () => query,
        maybeSingle: () => { single = true; return Promise.resolve(execute()); },
        single: () => { single = true; return Promise.resolve(execute()); },
        then: (resolve: (value: ReturnType<typeof execute>) => unknown, reject?: (reason: unknown) => unknown) => Promise.resolve().then(execute).then(resolve, reject),
      };
      return query;
    },
  };
  return { db, rows, calls };
}
