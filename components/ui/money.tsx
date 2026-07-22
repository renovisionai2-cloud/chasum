import { formatMoneyCents, formatMoneyDollars } from "@/lib/commerce/money";
import { cn } from "@/lib/utils";

type MoneyProps = {
  cents?: number;
  dollars?: number;
  currency?: string | null;
  className?: string;
};

/** Canonical money display — always inherits business currency. */
export function Money({ cents, dollars, currency, className }: MoneyProps) {
  const value =
    cents != null
      ? formatMoneyCents(cents, currency)
      : formatMoneyDollars(dollars ?? 0, currency);
  return (
    <span className={cn("tabular-nums", className)}>{value}</span>
  );
}
