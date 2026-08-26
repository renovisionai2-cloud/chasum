"use client";

import { Reveal } from "@/components/landing/reveal";
import { presentFlagshipRecommendation } from "@/lib/marketing/meet-summer-intelligence";
import { FS_RECS_INTRO } from "@/lib/marketing/flagship-summer";
import type { SessionMemory } from "@/lib/website-concierge/types";
import { cn } from "@/lib/utils";

export function FlagshipRecommendations({
  memory,
}: {
  memory: SessionMemory;
}) {
  const ids = memory.recommendationsMade.slice(0, 4);

  if (!ids.length) return null;

  const cards = ids.map((id) => ({
    id,
    ...presentFlagshipRecommendation(id, memory),
  }));

  return (
    <section className="fs-scene" aria-labelledby="fs-recs-title">
      <Reveal>
        <p className="fs-scene-kicker">{FS_RECS_INTRO.kicker}</p>
        <h2 id="fs-recs-title" className="fs-scene-title">
          {FS_RECS_INTRO.title}
        </h2>
        <p className="fs-scene-lede">{FS_RECS_INTRO.lede}</p>
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
