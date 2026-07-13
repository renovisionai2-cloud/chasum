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
