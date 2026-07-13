import {
  BRAND_ASSETS,
  BRAND_NAME,
} from "@/lib/brand/assets";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export type LogoVariant = "color" | "dark" | "light";
export type LogoSize = "sm" | "md" | "lg" | "xl";

type LogoProps = {
  className?: string;
  /** When false, renders The C Mark only (no wordmark). */
  showText?: boolean;
  href?: string | null;
  size?: LogoSize;
  /**
   * color — framed primary badge (`/brand/logo.svg`) — default for product chrome
   * dark — C Mark for light backgrounds (`/brand/logo-dark.svg`)
   * light — C Mark for dark backgrounds (`/brand/logo-light.svg`)
   */
  variant?: LogoVariant;
  /** Wordmark class override for marketing hero contexts. */
  wordmarkClassName?: string;
  priority?: boolean;
};

const sizePx: Record<LogoSize, number> = {
  sm: 28,
  md: 36,
  lg: 44,
  xl: 56,
};

const textSize: Record<LogoSize, string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-xl",
  xl: "text-2xl",
};

function srcFor(variant: LogoVariant): string {
  switch (variant) {
    case "light":
      return BRAND_ASSETS.logoLight;
    case "dark":
      return BRAND_ASSETS.logoDark;
    default:
      return BRAND_ASSETS.logo;
  }
}

/**
 * Official Chasum logo — Option 01 "The C Mark" + wordmark.
 * Assets: `/public/brand/`. Do not redraw or substitute a generic letter C.
 */
export function Logo({
  className,
  showText = true,
  href = "/",
  size = "md",
  variant = "color",
  wordmarkClassName,
  priority = false,
}: LogoProps) {
  const px = sizePx[size];
  const src = srcFor(variant);

  const mark = (
    <Image
      src={src}
      alt=""
      width={px}
      height={px}
      className={cn("shrink-0", variant === "color" && "rounded-[22%]")}
      priority={priority}
      unoptimized
    />
  );

  const wordmark = showText ? (
    <span
      className={cn(
        "font-semibold tracking-tight text-foreground",
        textSize[size],
        wordmarkClassName,
      )}
    >
      {BRAND_NAME}
    </span>
  ) : null;

  const content = (
    <>
      {mark}
      {wordmark}
    </>
  );

  if (href === null) {
    return (
      <span
        className={cn("inline-flex items-center gap-2.5", className)}
        role="img"
        aria-label={BRAND_NAME}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90",
        className,
      )}
      aria-label={BRAND_NAME}
    >
      <span className="transition-transform duration-200 group-hover:scale-105">
        {mark}
      </span>
      {wordmark}
    </Link>
  );
}

/** Standalone C Mark from brand assets — watermarks, badges, compact UI. */
export function LogoMark({
  className,
  variant = "dark",
  size = 20,
}: {
  className?: string;
  variant?: LogoVariant;
  size?: number;
}) {
  return (
    <Image
      src={srcFor(variant)}
      alt={BRAND_NAME}
      width={size}
      height={size}
      className={cn(
        "shrink-0",
        variant === "color" && "rounded-[22%]",
        className,
      )}
      unoptimized
    />
  );
}
