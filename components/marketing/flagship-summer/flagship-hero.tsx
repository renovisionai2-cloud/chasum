"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import { FS_HERO } from "@/lib/marketing/flagship-summer";
import { cn } from "@/lib/utils";

export function FlagshipHero({
  onBegin,
  exiting,
}: {
  onBegin: () => void;
  exiting?: boolean;
}) {
  return (
    <section
      className={cn("fs-hero", exiting && "fs-hero-exit")}
      aria-labelledby="fs-hero-brand"
    >
      <div className="fs-hero-atmosphere" aria-hidden>
        <span className="fs-hero-particles" />
        <span className="fs-hero-horizon" />
      </div>

      <div className="fs-hero-inner">
        <SummerOrb size="lg" className="fs-hero-orb" />
        <p id="fs-hero-brand" className="fs-hero-brand">
          {FS_HERO.brand}
        </p>
        <h1 className="fs-hero-headline">{FS_HERO.headline}</h1>
        <p className="fs-hero-support">{FS_HERO.support}</p>
        <button type="button" className="fs-cta" onClick={onBegin}>
          {FS_HERO.cta}
          <span aria-hidden>→</span>
        </button>
      </div>
    </section>
  );
}
