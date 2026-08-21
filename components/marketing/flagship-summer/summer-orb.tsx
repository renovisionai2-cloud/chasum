"use client";

import { cn } from "@/lib/utils";

type SummerOrbProps = {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  active?: boolean;
  /** Soft thinking pulse — halo + core glow while Summer prepares a reply. */
  thinking?: boolean;
  className?: string;
  label?: string;
  /** Extra cinematic layers for the flagship hero */
  cinematic?: boolean;
  /** Living presence — float, breathe, blink, gaze (decorative). */
  living?: boolean;
};

const SIZE = {
  sm: "fs-orb-sm",
  md: "fs-orb-md",
  lg: "fs-orb-lg",
  xl: "fs-orb-xl",
  hero: "fs-orb-hero",
} as const;

/**
 * Abstract Summer identity — calm neural light, not a mascot.
 */
export function SummerOrb({
  size = "md",
  active = false,
  thinking = false,
  className,
  label = "Summer",
  cinematic = false,
  living = false,
}: SummerOrbProps) {
  const alive = living || cinematic;

  return (
    <div
      className={cn(
        "fs-orb",
        SIZE[size],
        active && "fs-orb-active",
        thinking && "fs-orb-thinking",
        cinematic && "fs-orb-cinematic",
        alive && "fs-orb-living",
        className,
      )}
      role="img"
      aria-label={label}
    >
      {cinematic || thinking ? (
        <>
          <span className="fs-orb-ripple" aria-hidden />
          <span className="fs-orb-halo" aria-hidden />
        </>
      ) : null}
      <span className="fs-orb-core" aria-hidden>
        <span className="fs-orb-eyes" aria-hidden>
          <span className="fs-orb-eye" />
          <span className="fs-orb-eye" />
        </span>
      </span>
      <span className="fs-orb-ring" aria-hidden />
      <span className="fs-orb-haze" aria-hidden />
    </div>
  );
}
