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
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

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
 * Conversation presentation refined; engines unchanged.
 */
export function FlagshipExperience() {
  const [started, setStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [discoveryKey, setDiscoveryKey] = useState(0);
  const {
    memory,
    pending,
    refineUnderstanding,
    resetDiscoveryPath,
    hydrated,
  } = useConciergeConversation();
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
    !!selectedType ||
    (discoveryKey === 0 && memory.businessType !== "unknown");

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
      // Replace any prior path understanding — never keep contradictory replies
      await refineUnderstanding(prompt);
    },
    [refineUnderstanding],
  );

  const onChangeCategory = useCallback(() => {
    resetDiscoveryPath();
    setSelectedType(null);
    setDiscoveryKey((k) => k + 1);
    window.setTimeout(() => {
      document
        .getElementById("fs-guided-anchor")
        ?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }, 40);
  }, [resetDiscoveryPath, reducedMotion]);

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
            <div id="fs-guided-anchor" className="scroll-mt-8" />
            <FlagshipDiscovery
              key={discoveryKey}
              selectedId={selectedType}
              disabled={!hydrated || pending}
              onSelect={onSelectType}
              resumeAtChoices={discoveryKey > 0}
            />

            {showConsult ? (
              <section
                className="fs-scene fs-consult fs-consult-enter"
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
                  <FlagshipConversation onChangeCategory={onChangeCategory} />
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
