import { FlagshipExperience } from "@/components/marketing/flagship-summer/flagship-experience";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet Summer | Your AI Business Manager",
  description:
    "Meet Summer, the AI Business Manager behind Chasum. She helps businesses discover Chasum, get set up, answer customers, manage appointments, support staff, and grow every day.",
  openGraph: {
    title: "Meet Summer | Your AI Business Manager",
    description:
      "Summer is Chasum’s AI Business Manager — discovery, onboarding, operations, customer support, and growth in one AI-powered experience.",
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
