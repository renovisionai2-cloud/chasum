import { cn } from "@/lib/utils";

type MarkProps = {
  className?: string;
  /** When true, mark uses currentColor; otherwise inherits from parent. */
  title?: string;
};

/**
 * Option 01 — "The C"
 * Primary Chasum lettermark: an open geometric C.
 */
export function ChasumMark({ className, title = "Chasum" }: MarkProps) {
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
        d="M22.5 8.2C20.6 6.5 18.1 5.5 15.4 5.5 9.6 5.5 4.9 10.2 4.9 16s4.7 10.5 10.5 10.5c2.7 0 5.2-1 7.1-2.7"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Option 02 — "The Spark"
 * AI symbol used for intelligence, automation, and loading accents.
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
  sm: "h-8 w-8 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-11 w-11 rounded-2xl",
} as const;

const iconSizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
} as const;

/** Framed brand mark for nav, auth, and product chrome. */
export function BrandBadge({
  className,
  size = "md",
  mark = "c",
}: BrandBadgeProps) {
  const Icon = mark === "spark" ? SparkMark : ChasumMark;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center bg-primary text-primary-foreground shadow-sm shadow-primary/20",
        sizeMap[size],
        className,
      )}
      aria-hidden={true}
    >
      <Icon className={iconSizeMap[size]} />
    </span>
  );
}
