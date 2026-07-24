"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import { FS_HERO } from "@/lib/marketing/flagship-summer";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Phase 7 — full-viewport cinematic hero with sequenced reveal.
 * Visual experience only.
 */
export function FlagshipHero({
  onBegin,
  exiting,
}: {
  onBegin: () => void;
  exiting?: boolean;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  return (
    <section
      className={cn(
        "fs-hero fs-hero-seq",
        exiting && "fs-hero-exit",
        reducedMotion && "fs-hero-reduced",
      )}
      aria-labelledby="fs-hero-brand"
    >
      <div className="fs-hero-atmosphere" aria-hidden>
        <span className="fs-hero-void" />
        <span className="fs-hero-bloom fs-hero-seq-light" />
        <span className="fs-hero-volumetric" />
        <span className="fs-hero-particles" />
        <span className="fs-hero-horizon" />
      </div>

      <div className="fs-hero-inner">
        <div className={cn("fs-hero-seq-orb", exiting && "fs-hero-orb-expand")}>
          <SummerOrb
            size="hero"
            active
            cinematic
            className="fs-hero-orb"
          />
        </div>

        <p id="fs-hero-brand" className="fs-hero-brand fs-hero-seq-headline">
          {FS_HERO.brand}
        </p>
        <h1 className="fs-hero-headline fs-hero-seq-sub">{FS_HERO.headline}</h1>

        <ul className="fs-hero-micro fs-hero-seq-sub">
          {FS_HERO.micro.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <div className="fs-hero-cta-wrap fs-hero-seq-cta">
          <button type="button" className="fs-cta" onClick={onBegin}>
            {FS_HERO.cta}
            <span aria-hidden>→</span>
          </button>
          <p className="fs-hero-cta-hint">{FS_HERO.ctaHint}</p>
        </div>
      </div>
    </section>
  );
}
