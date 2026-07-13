import { Logo } from "@/components/brand/logo";
import { SparkMark } from "@/components/brand/marks";
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

/** Full-viewport splash while the app shell boots. */
export function SplashScreen({ label = "Loading Chasum…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative">
        <Logo size="xl" href={null} />
        <span className="absolute -right-2 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-spark text-spark-foreground shadow-sm animate-spark-pulse">
          <SparkMark className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Inline branded page loader (route loading.tsx, panels). */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div className="relative">
        <Logo size="lg" href={null} showText={false} />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-spark text-spark-foreground shadow-sm animate-spark-pulse">
          <SparkMark className="h-3 w-3" />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/** Compact app loader for dialogs and overlays. */
export function AppLoader({
  label = "Please wait…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8",
        className,
      )}
      role="status"
      aria-label={label}
    >
      <Logo size="md" href={null} showText={false} />
      <Spinner className="h-5 w-5" />
      <p className="text-xs text-muted-foreground">{label}</p>
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
      <div className="flex items-center gap-2 opacity-70">
        <Logo size="sm" href={null} showText={false} />
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-spark/20 text-spark">
          <SparkMark className="h-3 w-3 animate-spark-pulse" />
        </span>
      </div>
    </div>
  );
}
