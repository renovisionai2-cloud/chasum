import { BrandBadge, SparkMark } from "@/components/brand/marks";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  children,
  icon = "c",
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  icon?: "c" | "spark" | "none";
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
      {icon !== "none" && (
        <div className="mb-5">
          {icon === "spark" ? (
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-spark-muted text-spark">
              <SparkMark className="h-6 w-6" />
            </span>
          ) : (
            <BrandBadge size="lg" mark="c" />
          )}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
