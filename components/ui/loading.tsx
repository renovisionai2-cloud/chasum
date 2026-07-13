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
    <div className="ds-page" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-48 w-full rounded-[var(--radius-lg)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Skeleton className="h-72 xl:col-span-3" />
        <div className="space-y-3 xl:col-span-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
      <Skeleton className="h-56 w-full" />
      <div className="flex items-center gap-2 opacity-60">
        <BrandBadge size="sm" mark="c" className="opacity-40" />
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-spark/20 text-spark">
          <SparkMark className="h-3 w-3 animate-spark-pulse" />
        </span>
      </div>
    </div>
  );
}
