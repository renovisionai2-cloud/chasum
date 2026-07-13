import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  sparkline?: number[];
  accent?: "primary" | "spark" | "success" | "warning";
  comparison?: { label: string; tone: "up" | "down" | "flat" } | null;
  className?: string;
  style?: CSSProperties;
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
  comparison,
  className,
  style,
}: StatCardProps) {
  const body = (
    <Card
      className={cn(
        "h-full overflow-hidden animate-fade-in-up",
        href && "ds-card-interactive cursor-pointer",
        className,
      )}
      style={style}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="ds-label">{title}</p>
            <p className="truncate text-3xl font-semibold tracking-tight text-foreground transition-transform duration-200 group-hover:translate-x-0.5">
              {value}
            </p>
          </div>
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-200 group-hover:scale-105",
              accentIcon[accent],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
        {sparkline && sparkline.length > 1 && (
          <Sparkline values={sparkline} className="h-8 text-primary/80" />
        )}
        <div className="mt-auto space-y-1">
          {comparison && (
            <p
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                comparison.tone === "up" && "text-success",
                comparison.tone === "down" && "text-destructive",
                comparison.tone === "flat" && "text-muted-foreground",
              )}
            >
              {comparison.tone === "up" && (
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {comparison.tone === "down" && (
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {comparison.tone === "flat" && (
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {comparison.label}
            </p>
          )}
          {description && (
            <p className="truncate text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block focus-visible:rounded-[var(--radius-lg)] ds-focus-ring"
      >
        {body}
      </Link>
    );
  }

  return body;
}
