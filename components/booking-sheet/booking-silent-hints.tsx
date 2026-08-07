"use client";

/**
 * Silent, grounded booking hints — no chat panel, no invented advice.
 */
export function BookingSilentHints({
  upcomingCount,
  outstandingBalanceCount,
  emptyReason,
}: {
  upcomingCount?: number | null;
  outstandingBalanceCount?: number | null;
  emptyReason?: string | null;
}) {
  const hints: string[] = [];
  if ((upcomingCount ?? 0) > 0) {
    hints.push(
      `Customer already has ${upcomingCount} upcoming appointment${
        upcomingCount === 1 ? "" : "s"
      }.`,
    );
  }
  if ((outstandingBalanceCount ?? 0) > 0) {
    hints.push(
      `Outstanding balance: ${outstandingBalanceCount} item${
        outstandingBalanceCount === 1 ? "" : "s"
      }.`,
    );
  }
  if (emptyReason) {
    hints.push(emptyReason);
  }
  if (hints.length === 0) return null;

  return (
    <aside
      className="rounded-[var(--radius-md)] border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground"
      aria-label="Booking context"
    >
      <ul className="space-y-1">
        {hints.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
    </aside>
  );
}
