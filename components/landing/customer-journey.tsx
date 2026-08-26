"use client";

import { Reveal } from "@/components/landing/reveal";
import {
  PRODUCT_TOUR_INTRO,
  PRODUCT_TOUR_JOURNEY,
} from "@/lib/marketing/product-tour-page";
import { cn } from "@/lib/utils";
import { useState, type KeyboardEvent } from "react";

/**
 * Connected customer journey — seven-stage rail with one focused explanation.
 */
export function CustomerJourney() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = PRODUCT_TOUR_JOURNEY[activeIndex]!;
  const last = PRODUCT_TOUR_JOURNEY.length - 1;

  function select(index: number) {
    const next = Math.min(last, Math.max(0, index));
    setActiveIndex(next);
    document.getElementById(`pt-journey-tab-${PRODUCT_TOUR_JOURNEY[next]!.step}`)?.focus();
  }

  function onRailKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      select(activeIndex + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      select(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0);
    } else if (event.key === "End") {
      event.preventDefault();
      select(last);
    }
  }

  return (
    <section
      id="how-it-works"
      className="pt-journey marketing-section-contain scroll-mt-24 px-6 py-14 md:py-20"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="pt-journey-intro mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">{PRODUCT_TOUR_INTRO.eyebrow}</p>
            <h1 id="journey-heading" className="marketing-h2-xl">
              {PRODUCT_TOUR_INTRO.headline}
            </h1>
            <p className="pt-journey-lede marketing-lede" id="journey">
              {PRODUCT_TOUR_INTRO.lede}
            </p>
          </div>
        </Reveal>

        <Reveal delayMs={80}>
          <div className="pt-journey-stage">
            <div className="pt-journey-rail-wrap" aria-hidden>
              <div className="marketing-journey-line pt-journey-rail" />
              <span className="pt-journey-pulse" />
            </div>

            <div
              role="tablist"
              aria-label="Customer journey stages"
              className="pt-journey-steps"
              onKeyDown={onRailKeyDown}
            >
              {PRODUCT_TOUR_JOURNEY.map((item, index) => {
                const selected = index === activeIndex;
                return (
                  <button
                    key={item.step}
                    type="button"
                    role="tab"
                    id={`pt-journey-tab-${item.step}`}
                    aria-selected={selected}
                    aria-controls="pt-journey-panel"
                    tabIndex={selected ? 0 : -1}
                    className={cn(
                      "pt-journey-step",
                      selected && "pt-journey-step-active",
                    )}
                    onClick={() => select(index)}
                  >
                    <span className="marketing-journey-node pt-journey-node">
                      <span className="pt-journey-node-label">{item.step}</span>
                    </span>
                    <span className="pt-journey-title">{item.title}</span>
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id="pt-journey-panel"
              aria-labelledby={`pt-journey-tab-${active.step}`}
              className="pt-journey-focus"
            >
              <p className="pt-journey-focus-kicker">
                <span className="pt-journey-focus-num">{active.step}</span>
                {active.title}
              </p>
              <p className="pt-journey-why">{active.why}</p>
              <p className="pt-journey-detail">{active.detail}</p>
              <p className="pt-journey-moment">
                <span className="pt-journey-moment-kind">{active.moment.kind}.</span>{" "}
                {active.moment.text}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delayMs={140}>
          <p className="pt-journey-bridge mx-auto max-w-2xl text-center text-muted-foreground">
            {PRODUCT_TOUR_INTRO.bridgeToShowcase}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
