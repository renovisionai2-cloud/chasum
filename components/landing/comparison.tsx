import { Reveal } from "@/components/landing/reveal";
import {
  COMPARISON_COLUMNS,
  COMPARISON_ROWS,
  type ComparisonValue,
} from "@/lib/marketing/homepage";
import { cn } from "@/lib/utils";

const LABELS: Record<ComparisonValue, string> = {
  yes: "Yes",
  partial: "Partial",
  roadmap: "Roadmap",
  varies: "Varies",
};

const TONE: Record<ComparisonValue, string> = {
  yes: "text-primary",
  partial: "text-foreground",
  roadmap: "text-spark",
  varies: "text-muted-foreground",
};

export function Comparison() {
  return (
    <section
      id="compare"
      className="scroll-mt-20 border-y border-border bg-muted/30 px-6 py-20 md:py-28"
      aria-labelledby="compare-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="compare-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              How Chasum compares
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Structured for honesty. Competitor capabilities vary by plan and
              change over time — use this as a starting checklist, not a final
              verdict.
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="mt-10 overflow-x-auto rounded-[var(--radius-md)] border border-border bg-card shadow-sm">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3.5 font-medium backdrop-blur-sm">
                    Capability
                  </th>
                  {COMPARISON_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className={cn(
                        "px-3 py-3.5 text-center font-medium",
                        col === "Chasum" &&
                          "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
                      )}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/80">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="hover:bg-muted/20">
                    <th className="sticky left-0 z-10 bg-card px-4 py-3.5 align-top text-sm font-medium text-foreground">
                      {row.feature}
                      {row.note ? (
                        <p className="mt-1 text-xs font-normal text-muted-foreground">
                          {row.note}
                        </p>
                      ) : null}
                    </th>
                    {COMPARISON_COLUMNS.map((col) => {
                      const value = row.values[col];
                      return (
                        <td
                          key={col}
                          className={cn(
                            "px-3 py-3.5 text-center align-top tabular-nums",
                            col === "Chasum"
                              ? "bg-primary/[0.06] font-semibold text-primary"
                              : TONE[value],
                          )}
                        >
                          {LABELS[value]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Comparison cells are data-driven — update{" "}
            <code className="rounded bg-muted px-1 py-0.5">COMPARISON_ROWS</code>{" "}
            as capabilities ship.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
