"use client";

import { Reveal } from "@/components/landing/reveal";
import { FS_INTELLIGENCE } from "@/lib/marketing/flagship-summer";

export function FlagshipIntelligence() {
  return (
    <section className="fs-scene fs-intel" aria-labelledby="fs-intel-title">
      <Reveal>
        <p className="fs-scene-kicker">Intelligence</p>
        <h2 id="fs-intel-title" className="fs-scene-title fs-scene-title-xl">
          Traditional software stores.
          <br />
          Summer understands.
        </h2>
      </Reveal>

      <ul className="fs-intel-grid">
        {FS_INTELLIGENCE.map((row, i) => (
          <Reveal key={row.summer} delayMs={i * 60}>
            <li className="fs-intel-card">
              <p className="fs-intel-traditional">{row.traditional}</p>
              <p className="fs-intel-summer">{row.summer}</p>
            </li>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
