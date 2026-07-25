import { FlagshipExperience } from "@/components/marketing/flagship-summer/flagship-experience";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet Summer | Chasum’s AI Business Assistant",
  description:
    "Meet Summer, Chasum’s AI Business Assistant. Explore the product, discover workflows, and apply for Private Alpha.",
  openGraph: {
    title: "Meet Summer | Chasum’s AI Business Assistant",
    description:
      "Chasum’s AI Business Assistant — website concierge, product guide, and Early Access reception assistance.",
    images: [
      {
        url: BRAND_ASSETS.ogImage,
        width: 1200,
        height: 630,
        alt: `${BRAND_NAME} — Meet Summer`,
      },
    ],
  },
};

/**
 * Flagship Meet Summer — complete replacement of prior prototypes.
 * Engines: Knowledge, Discovery, Session Memory, Provider Registry.
 */
export default function MeetSummerPage() {
  return <FlagshipExperience />;
}
