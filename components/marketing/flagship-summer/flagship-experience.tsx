"use client";

import { FlagshipAlpha } from "@/components/marketing/flagship-summer/flagship-alpha";
import { FlagshipAwakening } from "@/components/marketing/flagship-summer/flagship-awakening";
import { FlagshipConversation } from "@/components/marketing/flagship-summer/flagship-conversation";
import { FlagshipDiscovery } from "@/components/marketing/flagship-summer/flagship-discovery";
import { FlagshipHero } from "@/components/marketing/flagship-summer/flagship-hero";
import { FlagshipIntelligence } from "@/components/marketing/flagship-summer/flagship-intelligence";
import { FlagshipRecommendations } from "@/components/marketing/flagship-summer/flagship-recommendations";
import { FlagshipRoadmap } from "@/components/marketing/flagship-summer/flagship-roadmap";
import { FlagshipThinking } from "@/components/marketing/flagship-summer/flagship-thinking";
import { FlagshipUnderstanding } from "@/components/marketing/flagship-summer/flagship-understanding";
import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { cn } from "@/lib/utils";
import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Flagship Meet Summer — cinematic scrolling experience.
 * Hero transforms into the journey; engines unchanged.
 */
export function FlagshipExperience() {
  const [started, setStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { memory, pending, send, hydrated } = useConciergeConversation();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    if (!started) return;
    const el = document.getElementById("fs-journey");
    el?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [started, reducedMotion]);

  function begin() {
    if (reducedMotion) {
      setStarted(true);
      return;
    }
    setExiting(true);
    window.setTimeout(() => setStarted(true), 700);
  }

  async function onSelectType(prompt: string, id: string) {
    setSelectedType(id);
    await send(prompt);
  }

  return (
    <div className={cn("fs", started && "fs-started")}>
      {!started ? (
        <FlagshipHero onBegin={begin} exiting={exiting} />
      ) : (
        <>
          <div className="fs-journey-atmosphere" aria-hidden />
          <div id="fs-journey" className="fs-journey scroll-mt-0">
            <FlagshipAwakening />
            <FlagshipDiscovery
              selectedId={selectedType}
              disabled={!hydrated || pending}
              onSelect={onSelectType}
            />
            <FlagshipThinking
              memory={memory}
              pending={pending}
              reducedMotion={reducedMotion}
            />
            {selectedType || memory.businessType !== "unknown" ? (
              <div className="fs-scene">
                <FlagshipConversation />
              </div>
            ) : null}
            <FlagshipUnderstanding memory={memory} />
            <FlagshipRecommendations memory={memory} />
            <FlagshipIntelligence />
            <FlagshipRoadmap />
            <FlagshipAlpha />
          </div>
        </>
      )}
    </div>
  );
}
