import { ThemeScript } from "@/components/layout/theme-script";
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand/assets";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: BRAND_NAME,
  title: {
    default: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "The AI-powered Business Operating System for service businesses. Scheduling, clients, locations, and intelligent automation in one platform.",
  keywords: [
    "Chasum",
    "AI Business Operating System",
    "service business software",
    "scheduling",
    "CRM",
    "AI receptionist",
  ],
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  manifest: BRAND_ASSETS.manifest,
  icons: {
    icon: [
      { url: BRAND_ASSETS.favicon, sizes: "any" },
      { url: BRAND_ASSETS.favicon16, sizes: "16x16", type: "image/png" },
      { url: BRAND_ASSETS.favicon32, sizes: "32x32", type: "image/png" },
      { url: BRAND_ASSETS.faviconSvg, type: "image/svg+xml" },
    ],
    apple: [{ url: BRAND_ASSETS.appleTouchIcon, sizes: "180x180" }],
    shortcut: BRAND_ASSETS.favicon,
  },
  appleWebApp: {
    capable: true,
    title: BRAND_NAME,
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description:
      "Scheduling, clients, locations, and intelligent automation in one platform.",
    images: [
      {
        url: BRAND_ASSETS.ogImage,
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description:
      "Scheduling, clients, locations, and intelligent automation in one platform.",
    images: [BRAND_ASSETS.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f5f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1324" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      data-scroll-behavior="smooth"
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        <link rel="manifest" href={BRAND_ASSETS.manifest} />
        <link rel="icon" href={BRAND_ASSETS.favicon} sizes="any" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={BRAND_ASSETS.favicon32}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={BRAND_ASSETS.favicon16}
        />
        <link rel="icon" href={BRAND_ASSETS.faviconSvg} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={BRAND_ASSETS.appleTouchIcon} />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
