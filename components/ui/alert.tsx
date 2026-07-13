import { SparkMark } from "@/components/brand/marks";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type AlertVariant = "default" | "info" | "success" | "warning" | "destructive" | "spark";

const variantStyles: Record<AlertVariant, string> = {
  default: "border-border bg-muted/40 text-foreground",
  info: "border-primary/20 bg-accent text-accent-foreground",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  destructive: "border-destructive/25 bg-destructive/10 text-destructive",
  spark: "border-spark/25 bg-spark-muted text-spark",
};

export function Alert({
  className,
  variant = "default",
  title,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
  title?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {title && <p className="mb-1 font-medium">{title}</p>}
      {children}
    </div>
  );
}

export function SparkCallout({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-[var(--radius-lg)] border border-spark/20 bg-spark-muted/60 p-4 text-sm text-foreground dark:bg-spark-muted/40",
        className,
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-spark text-spark-foreground">
        <SparkMark className="h-4 w-4" />
      </span>
      <div className="min-w-0 leading-relaxed">{children}</div>
    </div>
  );
}
