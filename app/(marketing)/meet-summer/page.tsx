import { FlagshipExperience } from "@/components/marketing/flagship-summer/flagship-experience";
import { BRAND_ASSETS, BRAND_NAME } from "@/lib/brand/assets";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meet Summer — The Intelligence Behind Every Business Decision",
  description:
    "Meet Summer, Chasum’s AI Business Assistant. A cinematic flagship experience — discovery, visible intelligence, recommendations, then Private Alpha.",
  openGraph: {
    title: "Meet Summer — The Intelligence Behind Every Business Decision",
    description:
      "Chasum’s flagship AI launch. Not a chatbot — the intelligence layer of an AI Business Operating System.",
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
