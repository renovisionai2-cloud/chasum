import { LogoIcon } from "@/components/brand/logo";
import { Spark } from "@/components/brand/spark";
import { cn } from "@/lib/utils";

type MarkProps = {
  className?: string;
  title?: string;
};

/** @deprecated Prefer LogoIcon — official Brand V1.0 C Mark. */
export function ChasumMark({ className }: MarkProps) {
  return <LogoIcon className={className} size={20} />;
}

/**
 * Official AI Spark.
 * Prefer importing `Spark` from `@/components/brand/spark`.
 */
export function SparkMark({ className, title = "Chasum AI" }: MarkProps) {
  return <Spark className={className} size={20} title={title} />;
}

type BrandBadgeProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  mark?: "c" | "spark";
};

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-11 w-11",
} as const;

const iconPx = {
  sm: 32,
  md: 36,
  lg: 44,
} as const;

/** Framed brand mark for empty states and compact chrome. */
export function BrandBadge({
  className,
  size = "md",
  mark = "c",
}: BrandBadgeProps) {
  if (mark === "spark") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-[22%] bg-spark/15 text-spark",
          sizeMap[size],
          className,
        )}
        aria-hidden
      >
        <Spark className="h-[55%] w-[55%]" size={iconPx[size] * 0.55} animate />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex shrink-0", sizeMap[size], className)}
      aria-hidden
    >
      <LogoIcon size={iconPx[size]} className="h-full w-full" />
    </span>
  );
}
