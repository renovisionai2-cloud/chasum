"use client";

import { FlagshipAlpha } from "@/components/marketing/flagship-summer/flagship-alpha";
import { FlagshipConversation } from "@/components/marketing/flagship-summer/flagship-conversation";
import { FlagshipDiscovery } from "@/components/marketing/flagship-summer/flagship-discovery";
import { FlagshipHero } from "@/components/marketing/flagship-summer/flagship-hero";
import { FlagshipIntelligence } from "@/components/marketing/flagship-summer/flagship-intelligence";
import { FlagshipRecommendations } from "@/components/marketing/flagship-summer/flagship-recommendations";
import { FlagshipRoadmap } from "@/components/marketing/flagship-summer/flagship-roadmap";
import { FlagshipThinking } from "@/components/marketing/flagship-summer/flagship-thinking";
import { FlagshipUnderstanding } from "@/components/marketing/flagship-summer/flagship-understanding";
import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { FS_BUSINESS_TYPES, FS_GUIDED } from "@/lib/marketing/flagship-summer";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Flagship Meet Summer — cinematic consultation experience.
 * Hero → guided discovery → live profile conversation; engines unchanged.
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

  const industryLabel = useMemo(() => {
    if (!selectedType) return null;
    return FS_BUSINESS_TYPES.find((t) => t.id === selectedType)?.label ?? null;
  }, [selectedType]);

  const showConsult =
    !!selectedType || memory.businessType !== "unknown";

  useEffect(() => {
    if (!started) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [started]);

  function begin() {
    if (reducedMotion) {
      setStarted(true);
      return;
    }
    setExiting(true);
    window.setTimeout(() => setStarted(true), 1200);
  }

  const onSelectType = useCallback(
    async (prompt: string, id: string) => {
      setSelectedType(id);
      await send(prompt);
    },
    [send],
  );

  return (
    <div
      className={cn(
        "fs",
        started && "fs-started",
        !started && "fs-hero-lock",
        exiting && "fs-exiting",
      )}
    >
      {!started ? (
        <FlagshipHero onBegin={begin} exiting={exiting} />
      ) : (
        <>
          <div className="fs-journey-enter" aria-hidden />
          <div className="fs-journey-atmosphere" aria-hidden />
          <div id="fs-journey" className="fs-journey scroll-mt-0">
            <FlagshipDiscovery
              selectedId={selectedType}
              disabled={!hydrated || pending}
              onSelect={onSelectType}
            />

            {showConsult ? (
              <section
                className="fs-scene fs-consult"
                aria-labelledby="fs-consult-title"
              >
                <h2 id="fs-consult-title" className="sr-only">
                  Continue discovering with Summer
                </h2>
                <div className="fs-consult-main">
                  <p className="fs-consult-bridge">{FS_GUIDED.continuePrompt}</p>
                  <FlagshipThinking
                    memory={memory}
                    pending={pending}
                    reducedMotion={reducedMotion}
                    compact
                  />
                  <FlagshipConversation />
                </div>
                <FlagshipUnderstanding
                  memory={memory}
                  industryLabel={industryLabel}
                  live
                />
              </section>
            ) : null}

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
