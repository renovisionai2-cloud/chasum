"use client";

import { cn } from "@/lib/utils";

type SummerOrbProps = {
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
  className?: string;
  label?: string;
};

const SIZE = {
  sm: "fs-orb-sm",
  md: "fs-orb-md",
  lg: "fs-orb-lg",
  xl: "fs-orb-xl",
} as const;

/**
 * Abstract Summer identity — neural light, not a mascot.
 */
export function SummerOrb({
  size = "md",
  active = false,
  className,
  label = "Summer",
}: SummerOrbProps) {
  return (
    <div
      className={cn("fs-orb", SIZE[size], active && "fs-orb-active", className)}
      role="img"
      aria-label={label}
    >
      <span className="fs-orb-core" aria-hidden>
        <span className="fs-orb-eye" />
        <span className="fs-orb-eye" />
      </span>
      <span className="fs-orb-ring" aria-hidden />
      <span className="fs-orb-haze" aria-hidden />
    </div>
  );
}
