import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type AmbientVariant =
  | "hero"
  | "calm"
  | "soft"
  | "cool"
  | "dawn"
  | "warm";

type AmbientBackgroundProps = {
  /** Visual mood for the ambient field. */
  variant?: AmbientVariant;
  className?: string;
};

/**
 * Living Interface — ambient motion field.
 * Extremely slow radial light movement (30–60s). Decorative only.
 * Disable via prefers-reduced-motion (CSS). Safe to reuse on Platform,
 * Product Tour, Industries, Pricing, and Dashboard later.
 */
export function AmbientBackground({
  variant = "calm",
  className,
}: AmbientBackgroundProps) {
  return (
    <div
      className={cn("ambient-bg", `ambient-bg--${variant}`, className)}
      aria-hidden
    >
      <span className="ambient-bg__orb ambient-bg__orb--a" />
      <span className="ambient-bg__orb ambient-bg__orb--b" />
      <span className="ambient-bg__orb ambient-bg__orb--c" />
    </div>
  );
}

type AmbientSectionProps = {
  variant?: AmbientVariant;
  className?: string;
  children: ReactNode;
};

/**
 * Section shell that places AmbientBackground behind content without CLS.
 */
export function AmbientSection({
  variant = "calm",
  className,
  children,
}: AmbientSectionProps) {
  return (
    <div className={cn("relative isolate overflow-x-clip", className)}>
      <AmbientBackground variant={variant} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
