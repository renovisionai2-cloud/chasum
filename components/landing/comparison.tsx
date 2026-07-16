import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  type ComparisonValue,
} from "@/lib/marketing/homepage";

const LABELS: Record<ComparisonValue, string> = {
  yes: "Yes",
  partial: "Partial",
  roadmap: "Roadmap",
  varies: "Varies",
};

export function Comparison() {
  return (
    <section
      id="compare"
      className="border-y border-border bg-muted/30 px-6 py-20 md:py-28"
      aria-labelledby="compare-heading"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="compare-heading"
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          >
            How Chasum compares
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Structured for honesty. Competitor capabilities vary by plan and
            change over time — use this as a starting checklist, not a final verdict.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-[var(--radius-md)] border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-3 font-medium">Capability</th>
                {COMPARISON_COLUMNS.map((col) => (
                  <th key={col} className="px-3 py-3 font-medium">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.feature}>
                  <th className="px-3 py-3 align-top text-sm font-medium text-foreground">
                    {row.feature}
                    {row.note ? (
                      <p className="mt-1 text-xs font-normal text-muted-foreground">
                        {row.note}
                      </p>
                    ) : null}
                  </th>
                  {COMPARISON_COLUMNS.map((col) => (
                    <td
                      key={col}
                      className={
                        col === "Chasum"
                          ? "px-3 py-3 align-top font-medium text-primary"
                          : "px-3 py-3 align-top text-muted-foreground"
                      }
                    >
                      {LABELS[row.values[col]]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
