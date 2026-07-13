import { BrandBadge, SparkMark } from "@/components/brand/marks";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type EmptyStateVariant = "page" | "panel" | "inline";

type EmptyStateProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
  icon?: "c" | "spark" | "none";
  glyph?: LucideIcon;
  variant?: EmptyStateVariant;
  className?: string;
};

const variantStyles: Record<EmptyStateVariant, string> = {
  page: "rounded-[var(--radius-lg)] border border-dashed border-border bg-muted/20 px-6 py-16",
  panel: "rounded-[var(--radius-md)] border border-dashed border-border/80 bg-muted/15 px-4 py-10",
  inline: "rounded-[var(--radius-md)] bg-muted/20 px-3 py-6",
};

export function EmptyState({
  title,
  description,
  children,
  icon = "c",
  glyph: Glyph,
  variant = "page",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        variantStyles[variant],
        className,
      )}
    >
      {Glyph ? (
        <span
          className={cn(
            "mb-4 inline-flex items-center justify-center rounded-2xl bg-accent text-primary",
            variant === "page" ? "h-12 w-12" : "h-10 w-10",
          )}
        >
          <Glyph className={variant === "page" ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
        </span>
      ) : (
        icon !== "none" && (
          <div className={variant === "inline" ? "mb-3" : "mb-5"}>
            {icon === "spark" ? (
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-spark-muted text-spark">
                <SparkMark className="h-6 w-6" />
              </span>
            ) : (
              <BrandBadge size={variant === "page" ? "lg" : "md"} mark="c" />
            )}
          </div>
        )
      )}
      <h3
        className={cn(
          "font-semibold text-foreground",
          variant === "page" ? "text-base" : "text-sm",
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 max-w-sm text-muted-foreground",
          variant === "page" ? "text-sm" : "text-xs",
        )}
      >
        {description}
      </p>
      {children && <div className={cn("mt-5", variant === "inline" && "mt-3")}>{children}</div>}
    </div>
  );
}
