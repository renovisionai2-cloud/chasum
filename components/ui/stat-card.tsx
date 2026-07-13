import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  sparkline?: number[];
  accent?: "primary" | "spark" | "success" | "warning";
  className?: string;
};

const accentIcon: Record<NonNullable<StatCardProps["accent"]>, string> = {
  primary: "bg-accent text-primary",
  spark: "bg-spark-muted text-spark",
  success: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  sparkline,
  accent = "primary",
  className,
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        "h-full overflow-hidden",
        href && "ds-card-interactive cursor-pointer",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="ds-label">{title}</p>
            <p className="truncate text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
              accentIcon[accent],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline values={sparkline} className="h-8 text-primary/80" />
        )}
        {description && (
          <p className="mt-auto truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:rounded-[var(--radius-lg)] ds-focus-ring">
        {body}
      </Link>
    );
  }

  return body;
}
