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
import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
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
 * Flagship Meet Summer — cinematic consultation scenes.
 * Presentation only; Discovery Engine unchanged.
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

  const inConsultation =
    !!selectedType ||
    (discoveryKey === 0 && memory.businessType !== "unknown");

  const showAftercare =
    memory.businessType !== "unknown" &&
    (memory.employeeCount ||
      memory.challenges.length > 0 ||
      memory.goals.length > 0 ||
      !!memory.currentSoftware);

  useEffect(() => {
    if (!started) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [started]);

  useEffect(() => {
    if (!inConsultation || !started) return;
    window.setTimeout(() => {
      document
        .getElementById("fs-consult-stage")
        ?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "center",
        });
    }, 80);
  }, [inConsultation, started, reducedMotion, selectedType]);

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
      await refineUnderstanding(prompt);
    },
    [refineUnderstanding],
  );

  const onBackToCategories = useCallback(() => {
    resetDiscoveryPath();
    setSelectedType(null);
    setDiscoveryKey((k) => k + 1);
    window.setTimeout(() => {
      document
        .getElementById("fs-guided-anchor")
        ?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "center",
        });
    }, 40);
  }, [resetDiscoveryPath, reducedMotion]);

  return (
    <div
      className={cn(
        "fs",
        started && "fs-started",
        !started && "fs-hero-lock",
        exiting && "fs-exiting",
        inConsultation && "fs-in-consult",
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

            {!inConsultation ? (
              <div className="fs-stage fs-stage-discover fs-scene-rise">
                <FlagshipDiscovery
                  key={discoveryKey}
                  selectedId={selectedType}
                  disabled={!hydrated || pending}
                  onSelect={onSelectType}
                  resumeAtChoices={discoveryKey > 0}
                />
              </div>
            ) : (
              <section
                id="fs-consult-stage"
                className="fs-stage fs-stage-consult fs-scene-rise"
                aria-labelledby="fs-consult-title"
              >
                <button
                  type="button"
                  className="fs-back-categories"
                  onClick={onBackToCategories}
                >
                  {FS_GUIDED.backToCategories}
                </button>

                <div className="fs-consult-presence">
                  <SummerOrb size="lg" active={pending} cinematic />
                  <div className="fs-consult-copy">
                    <p className="fs-scene-kicker">Consultation</p>
                    <h2 id="fs-consult-title" className="fs-consult-heading">
                      {industryLabel
                        ? `Understanding your ${industryLabel}`
                        : "Understanding your business"}
                    </h2>
                    <p className="fs-consult-bridge">{FS_GUIDED.continuePrompt}</p>
                  </div>
                </div>

                <FlagshipThinking
                  memory={memory}
                  pending={pending}
                  reducedMotion={reducedMotion}
                  compact
                />

                <FlagshipConversation />

                <FlagshipUnderstanding
                  memory={memory}
                  industryLabel={industryLabel}
                  live
                />
              </section>
            )}

            {showAftercare ? (
              <div className="fs-aftercare fs-scene-rise">
                <FlagshipRecommendations memory={memory} />
                <FlagshipIntelligence />
                <FlagshipRoadmap />
                <FlagshipAlpha />
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
