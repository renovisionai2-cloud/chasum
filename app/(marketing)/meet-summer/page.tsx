import { FlagshipExperience } from "@/components/marketing/flagship-summer/flagship-experience";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet Summer | Your AI Business Manager",
  description:
    "Meet Summer, your AI Business Manager. With Summer, Chasum helps you understand what is happening across your business, what needs attention, and what to do next.",
  openGraph: {
    title: "Meet Summer | Your AI Business Manager",
    description:
      "Summer is Chasum’s AI Business Manager across an AI Business Operating System for service businesses—not a chatbot, and not only a receptionist.",
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
