import { financialAmountText, unknownMoney, type FinancialAmount } from "@/lib/commerce/financial-aggregate/types";
import { formatMoneyCents, formatMoneyDollars } from "@/lib/commerce/money";
import { cn } from "@/lib/utils";

type MoneyProps = {
  cents?: number | null;
  amount?: FinancialAmount;
  dollars?: number | null;
  currency?: string | null;
  className?: string;
};

/** Canonical money display — always inherits business currency. */
export function Money({ cents, dollars, amount, currency, className }: MoneyProps) {
  const value =
    amount ? financialAmountText(amount) : cents != null && Number.isFinite(cents)
      ? formatMoneyCents(cents, currency)
      : dollars != null && Number.isFinite(dollars) ? formatMoneyDollars(dollars, currency) : financialAmountText(unknownMoney());
  return (
    <span className={cn("tabular-nums", className)}>{value}</span>
  );
}
