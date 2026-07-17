/** Official Chasum Brand V2 — single source of truth: `/public/brand-v2/`. */

const V2 = "/brand-v2";

export const BRAND_ASSETS = {
  /** Full lockup: icon + wordmark + tagline */
  logoFull: `${V2}/svg/logo-full.svg`,
  logoFullLight: `${V2}/png/logo-full-light.png`,
  /** Horizontal: icon + wordmark (nav / product chrome / email) */
  logoHorizontal: `${V2}/png/logo-horizontal.png`,
  logoHorizontalLight: `${V2}/png/logo-horizontal-light.png`,
  /** Wordmark name only — custom A + AI dot (never CSS text) */
  wordmark: `${V2}/png/wordmark.png`,
  wordmarkLight: `${V2}/png/wordmark-light.png`,
  /** Wordmark + tagline */
  wordmarkTagline: `${V2}/png/wordmark-tagline.png`,
  wordmarkTaglineLight: `${V2}/png/wordmark-tagline-light.png`,
  /** @deprecated Alias — same as wordmark */
  wordmarkName: `${V2}/png/wordmark.png`,
  wordmarkNameLight: `${V2}/png/wordmark-light.png`,
  /** Icon only — The C Mark with signal dots (SVG preferred) */
  logoIcon: `${V2}/svg/logo-icon.svg`,
  logoIconPng: `${V2}/png/logo-icon.png`,
  /** AI Spark — intelligence features only */
  spark: `${V2}/svg/spark.svg`,
  sparkPng: `${V2}/png/spark.png`,
  /** Favicons / PWA */
  favicon: `${V2}/favicon/favicon.ico`,
  faviconSvg: `${V2}/favicon/favicon.svg`,
  favicon16: `${V2}/favicon/favicon-16x16.png`,
  favicon32: `${V2}/favicon/favicon-32x32.png`,
  appleTouchIcon: `${V2}/favicon/apple-touch-icon.png`,
  androidChrome192: `${V2}/favicon/android-chrome-192x192.png`,
  androidChrome512: `${V2}/favicon/android-chrome-512x512.png`,
  manifestIcon: `${V2}/favicon/manifest-icon.png`,
  appIcon1024: `${V2}/png/app-icon-1024.png`,
  ogImage: `${V2}/social/og-image.png`,
  manifest: `${V2}/site.webmanifest`,

  /** Compatibility aliases */
  logo: `${V2}/svg/logo-icon.svg`,
  logoDark: `${V2}/svg/logo-icon.svg`,
  logoLight: `${V2}/svg/logo-icon.svg`,
  icon: `${V2}/svg/logo-icon.svg`,
} as const;

/** Brand Identity board palette */
export const BRAND_COLORS = {
  primary: "#2563EB",
  deepBlue: "#1E40AF",
  purple: "#7C3AED",
  darkNavy: "#0B1324",
  slate: "#334155",
  lightGray: "#F1F5F9",
  primaryForeground: "#ffffff",
  ink: "#0B1324",
  spark: "#7C3AED",
} as const;

export const BRAND_NAME = "Chasum";
export const BRAND_TAGLINE = "AI Business Operating System";
