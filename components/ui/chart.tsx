import { cn } from "@/lib/utils";

type ChartBar = {
  label: string;
  value: number;
};

/**
 * Lightweight bar chart primitive for design-system consistency.
 * Not wired to live analytics — presentational only.
 */
export function BarChart({
  data,
  className,
  max,
}: {
  data: ChartBar[];
  className?: string;
  max?: number;
}) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item) => (
        <div key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(4, (item.value / peak) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  values,
  className,
}: {
  values: number[];
  className?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn("h-10 w-full text-spark", className)}
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Compact vertical bars for weekly appointment volume. */
export function WeekBars({
  data,
  className,
}: {
  data: ChartBar[];
  className?: string;
}) {
  const peak = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("flex h-36 items-end gap-2 sm:gap-3", className)}>
      {data.map((item) => {
        const height = Math.max(8, (item.value / peak) * 100);
        return (
          <div
            key={item.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {item.value}
            </span>
            <div className="flex h-24 w-full items-end justify-center">
              <div
                className="w-full max-w-10 rounded-t-[var(--radius-sm)] bg-primary/85 transition-all duration-500 hover:bg-primary"
                style={{ height: `${height}%` }}
                title={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
