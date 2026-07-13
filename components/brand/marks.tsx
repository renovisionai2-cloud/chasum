import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type MarkProps = {
  className?: string;
  title?: string;
};

/**
 * Option 01 — "The C Mark"
 * Thin wrapper around the official brand asset. Do not redraw the path here.
 */
export function ChasumMark({ className }: MarkProps) {
  return <LogoMark className={className} variant="dark" size={20} />;
}

/**
 * Option 02 — "The Spark"
 * AI symbol used for intelligence, automation, and loading accents.
 * Not the primary logo — do not substitute for The C Mark.
 */
export function SparkMark({ className, title = "Chasum AI" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        d="M16 3.5L18.4 12.1L27 14.5L18.4 16.9L16 25.5L13.6 16.9L5 14.5L13.6 12.1L16 3.5Z"
        fill="currentColor"
      />
      <path
        d="M25.2 5.2L26.1 8.1L29 9L26.1 9.9L25.2 12.8L24.3 9.9L21.4 9L24.3 8.1L25.2 5.2Z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
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

/**
 * Framed brand mark for nav, auth, and product chrome.
 * Uses official `/brand/logo.svg` for The C Mark (never a redrawn letter).
 */
export function BrandBadge({
  className,
  size = "md",
  mark = "c",
}: BrandBadgeProps) {
  if (mark === "spark") {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-[22%] bg-spark text-spark-foreground shadow-sm shadow-spark/25",
          sizeMap[size],
          className,
        )}
        aria-hidden
      >
        <SparkMark className="h-[55%] w-[55%]" />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex shrink-0", sizeMap[size], className)}
      aria-hidden
    >
      <LogoMark
        variant="color"
        size={iconPx[size]}
        className="h-full w-full rounded-[22%]"
      />
    </span>
  );
}
