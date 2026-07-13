/** Canonical Option 01 — "The C Mark" path (viewBox 0 0 32 32). Do not redesign. */
export const CHASUM_C_MARK_PATH =
  "M22.5 8.2C20.6 6.5 18.1 5.5 15.4 5.5 9.6 5.5 4.9 10.2 4.9 16s4.7 10.5 10.5 10.5c2.7 0 5.2-1 7.1-2.7";

export const BRAND_ASSETS = {
  /** Primary framed mark (blue badge + white C) — product chrome default */
  logo: "/brand/logo.svg",
  /** C mark in dark/primary ink for light backgrounds */
  logoDark: "/brand/logo-dark.svg",
  /** C mark in white for dark backgrounds */
  logoLight: "/brand/logo-light.svg",
  /** Bare icon (transparent) */
  icon: "/brand/icon.svg",
  favicon: "/brand/favicon.svg",
  appleTouchIcon: "/brand/apple-touch-icon.png",
} as const;

export const BRAND_COLORS = {
  primary: "#1d4ed8",
  primaryForeground: "#ffffff",
  ink: "#0c1222",
  spark: "#0f766e",
} as const;

export const BRAND_NAME = "Chasum";
export const BRAND_TAGLINE = "AI Business Operating System";
