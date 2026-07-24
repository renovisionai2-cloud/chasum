"use client";

import { Reveal } from "@/components/landing/reveal";
import { FS_ROADMAP } from "@/lib/marketing/flagship-summer";

export function FlagshipRoadmap() {
  return (
    <section className="fs-scene" aria-labelledby="fs-roadmap-title">
      <Reveal>
        <p className="fs-scene-kicker">Roadmap</p>
        <h2 id="fs-roadmap-title" className="fs-scene-title">
          Toward the complete system.
        </h2>
      </Reveal>

      <ol className="fs-roadmap">
        {FS_ROADMAP.map((step, i) => (
          <Reveal key={`${step.label}-${step.detail}`} delayMs={i * 55}>
            <li className="fs-roadmap-step">
              <div className="fs-roadmap-rail" aria-hidden>
                <span className="fs-roadmap-dot" />
                {i < FS_ROADMAP.length - 1 ? (
                  <span className="fs-roadmap-line" />
                ) : null}
              </div>
              <div>
                <p className="fs-roadmap-label">{step.label}</p>
                <p className="fs-roadmap-detail">{step.detail}</p>
              </div>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
