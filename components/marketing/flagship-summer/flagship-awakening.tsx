"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import { FS_AWAKENING } from "@/lib/marketing/flagship-summer";
import { Reveal } from "@/components/landing/reveal";

export function FlagshipAwakening() {
  return (
    <section className="fs-scene fs-awakening" aria-labelledby="fs-awaken-title">
      <Reveal>
        <div className="fs-awakening-row">
          <SummerOrb size="xl" active />
          <div>
            <p className="fs-scene-kicker">Summer awakens</p>
            <h2 id="fs-awaken-title" className="sr-only">
              Summer awakens
            </h2>
            <div className="fs-awaken-lines">
              {FS_AWAKENING.lines.map((line) => (
                <p key={line} className="fs-awaken-line">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
