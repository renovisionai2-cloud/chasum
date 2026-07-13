import { ThemeScript } from "@/components/layout/theme-script";
import { BRAND_ASSETS, BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand/assets";
import { ThemeProvider } from "@/providers/theme-provider";
import { ToastProvider } from "@/providers/toast-provider";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: BRAND_NAME,
  title: {
    default: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "The AI-powered Business Operating System for service businesses. Scheduling, clients, locations, and intelligent automation in one platform.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: BRAND_ASSETS.favicon, type: "image/svg+xml" },
      { url: BRAND_ASSETS.icon, type: "image/svg+xml" },
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
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    description:
      "Scheduling, clients, locations, and intelligent automation in one platform.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fa" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1222" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="icon" href={BRAND_ASSETS.favicon} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={BRAND_ASSETS.appleTouchIcon} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
