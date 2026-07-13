import {
  BRAND_ASSETS,
  BRAND_NAME,
  BRAND_TAGLINE,
} from "@/lib/brand/assets";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type LogoTone = "dark" | "light";
export type LogoSize = "sm" | "md" | "lg" | "xl";

type CommonProps = {
  className?: string;
  priority?: boolean;
};

const heightPx: Record<LogoSize, number> = {
  sm: 28,
  md: 36,
  lg: 48,
  xl: 64,
};

const horizontalWidth: Record<LogoSize, number> = {
  sm: 132,
  md: 168,
  lg: 220,
  xl: 280,
};

const fullWidth: Record<LogoSize, number> = {
  sm: 160,
  md: 220,
  lg: 300,
  xl: 380,
};

const iconPx: Record<LogoSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
  xl: 56,
};

const wordmarkWidth: Record<LogoSize, number> = {
  sm: 110,
  md: 148,
  lg: 200,
  xl: 260,
};

/**
 * Official Chasum logo — Brand V1.0 horizontal lockup (icon + wordmark).
 * Artwork from `/public/brand/`. Never recreate with fonts/CSS.
 */
export function Logo({
  className,
  href = "/",
  size = "md",
  tone = "dark",
  /** When false, renders The C Mark only. */
  showText = true,
  /** Prefer full lockup with tagline (marketing). */
  withTagline = false,
  priority = false,
}: CommonProps & {
  href?: string | null;
  size?: LogoSize;
  tone?: LogoTone;
  showText?: boolean;
  withTagline?: boolean;
}) {
  if (!showText) {
    return (
      <LogoLink href={href} className={className} ariaLabel={BRAND_NAME}>
        <LogoIcon size={size} className="shrink-0" priority={priority} />
      </LogoLink>
    );
  }

  const src =
    withTagline
      ? tone === "light"
        ? BRAND_ASSETS.logoFullLight
        : BRAND_ASSETS.logoFull
      : tone === "light"
        ? BRAND_ASSETS.logoHorizontalLight
        : BRAND_ASSETS.logoHorizontal;

  const width = withTagline ? fullWidth[size] : horizontalWidth[size];
  const height = withTagline
    ? Math.round(heightPx[size] * 1.35)
    : heightPx[size];

  const img = (
    <Image
      src={src}
      alt={withTagline ? `${BRAND_NAME} — ${BRAND_TAGLINE}` : BRAND_NAME}
      width={width}
      height={height}
      className="h-auto w-auto max-h-full shrink-0 object-contain"
      style={{ height: height, width: "auto" }}
      priority={priority}
      unoptimized
    />
  );

  return (
    <LogoLink href={href} className={className} ariaLabel={BRAND_NAME}>
      {img}
    </LogoLink>
  );
}

/** Official C Mark icon (signal dots). */
export function LogoIcon({
  className,
  size = "md",
  priority = false,
  tone = "color",
}: CommonProps & {
  size?: LogoSize | number;
  tone?: "color" | "light";
}) {
  const px = typeof size === "number" ? size : iconPx[size];
  const src =
    tone === "light" ? BRAND_ASSETS.logoLight : BRAND_ASSETS.logoIcon;

  return (
    <Image
      src={src}
      alt={BRAND_NAME}
      width={px}
      height={px}
      className={cn("shrink-0 object-contain", className)}
      priority={priority}
      unoptimized
    />
  );
}

/** Standalone wordmark (custom A + AI dot). Never CSS text. */
export function Wordmark({
  className,
  size = "md",
  tone = "dark",
  showTagline = false,
  priority = false,
}: CommonProps & {
  size?: LogoSize;
  tone?: LogoTone;
  showTagline?: boolean;
}) {
  const src = showTagline
    ? tone === "light"
      ? BRAND_ASSETS.wordmarkTaglineLight
      : BRAND_ASSETS.wordmarkTagline
    : tone === "light"
      ? BRAND_ASSETS.wordmarkLight
      : BRAND_ASSETS.wordmark;

  const width = wordmarkWidth[size];
  const height = showTagline
    ? Math.round(heightPx[size] * 1.35)
    : heightPx[size];

  return (
    <Image
      src={src}
      alt={showTagline ? `${BRAND_NAME} — ${BRAND_TAGLINE}` : BRAND_NAME}
      width={width}
      height={height}
      className={cn("h-auto w-auto shrink-0 object-contain", className)}
      style={{ height, width: "auto" }}
      priority={priority}
      unoptimized
    />
  );
}

/** @deprecated Prefer LogoIcon — kept for existing call sites. */
export function LogoMark({
  className,
  size = 20,
  variant = "dark",
}: {
  className?: string;
  size?: number;
  variant?: "color" | "dark" | "light";
}) {
  return (
    <LogoIcon
      className={className}
      size={size}
      tone={variant === "light" ? "light" : "color"}
    />
  );
}

function LogoLink({
  href,
  className,
  ariaLabel,
  children,
}: {
  href?: string | null;
  className?: string;
  ariaLabel: string;
  children: ReactNode;
}) {
  if (href == null) {
    return (
      <span
        className={cn("inline-flex items-center", className)}
        role="img"
        aria-label={ariaLabel}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center transition-opacity hover:opacity-90",
        className,
      )}
      aria-label={ariaLabel}
    >
      <span className="transition-transform duration-200 group-hover:scale-[1.02]">
        {children}
      </span>
    </Link>
  );
}
