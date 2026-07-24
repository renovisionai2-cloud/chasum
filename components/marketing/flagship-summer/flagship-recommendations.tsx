"use client";

import { Reveal } from "@/components/landing/reveal";
import {
  FS_DEFAULT_RECS,
  FS_RECOMMENDATION_COPY,
} from "@/lib/marketing/flagship-summer";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";

export function FlagshipRecommendations({
  memory,
}: {
  memory: SessionMemory;
}) {
  const ids =
    memory.recommendationsMade.length > 0
      ? memory.recommendationsMade.slice(0, 4)
      : memory.businessType !== "unknown" && memory.challenges.length > 0
        ? [...FS_DEFAULT_RECS]
        : [];

  if (!ids.length) return null;

  const cards = ids.map((id) => {
    const copy = FS_RECOMMENDATION_COPY[id] ?? {
      title: id
        .split(/[-_]/)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" "),
      why: "Grounded in what you shared about how your business runs.",
      tone: "blue" as const,
    };
    return { id, ...copy };
  });

  return (
    <section className="fs-scene" aria-labelledby="fs-recs-title">
      <Reveal>
        <p className="fs-scene-kicker">Personalized recommendations</p>
        <h2 id="fs-recs-title" className="fs-scene-title">
          Based on what I&apos;ve learned…
        </h2>
        <p className="fs-scene-lede">
          Outcomes first — not a feature dump. Here is where Chasum tends to help
          a business like yours.
        </p>
      </Reveal>

      <ul className="fs-rec-grid">
        {cards.map((card, i) => (
          <Reveal key={card.id} delayMs={i * 70}>
            <li className={cn("fs-rec-card", `fs-rec-${card.tone}`)}>
              <p className="fs-rec-title">{card.title}</p>
              <p className="fs-rec-why">{card.why}</p>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
