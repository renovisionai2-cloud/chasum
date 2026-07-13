import { BrandBadge, SparkMark } from "@/components/brand/marks";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary",
        className,
      )}
    />
  );
}

export function PageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div className="relative">
        <BrandBadge size="lg" mark="c" className="opacity-90" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-spark text-spark-foreground shadow-sm animate-spark-pulse">
          <SparkMark className="h-3 w-3" />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-md)] bg-muted", className)}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-1">
      <div className="flex items-center gap-3">
        <BrandBadge size="sm" mark="c" className="opacity-40" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
