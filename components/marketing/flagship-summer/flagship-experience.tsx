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
import {
  FS_GUIDED,
  fsBuildMultiPrompt,
  type FsBusinessIndustry,
  type FsSelectedBusiness,
} from "@/lib/marketing/flagship-summer";
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
 * Flagship Meet Summer — fast-paced multi-business consultation.
 */
export function FlagshipExperience() {
  const [started, setStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [selections, setSelections] = useState<FsSelectedBusiness[]>([]);
  const [committed, setCommitted] = useState(false);
  const [discoveryKey, setDiscoveryKey] = useState(0);
  const {
    memory,
    pending,
    refineUnderstanding,
    setBusinessSelections,
    pauseConsultationKeepBusinesses,
    hydrated,
  } = useConciergeConversation();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const industryLabel = useMemo(() => {
    if (memory.businessTypes.length > 0) {
      return memory.businessTypes.join(" · ");
    }
    if (selections.length > 0) {
      return selections.map((s) => s.label).join(" · ");
    }
    return null;
  }, [memory.businessTypes, selections]);

  const inConsultation = committed;

  const showAftercare =
    committed &&
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
  }, [inConsultation, started, reducedMotion, selections.length]);

  function begin() {
    if (reducedMotion) {
      setStarted(true);
      return;
    }
    setExiting(true);
    window.setTimeout(() => setStarted(true), 420);
  }

  const onToggleIndustry = useCallback(
    (industry: FsBusinessIndustry, categoryId: string) => {
      setSelections((prev) => {
        const exists = prev.some((s) => s.id === industry.id);
        const next = exists
          ? prev.filter((s) => s.id !== industry.id)
          : [
              ...prev,
              {
                id: industry.id,
                label: industry.label,
                prompt: industry.prompt,
                categoryId,
              },
            ];
        setBusinessSelections(
          next.map((s) => s.label),
          next[0]?.prompt,
        );
        return next;
      });
    },
    [setBusinessSelections],
  );

  const onRemoveSelection = useCallback(
    (id: string) => {
      setSelections((prev) => {
        const next = prev.filter((s) => s.id !== id);
        setBusinessSelections(
          next.map((s) => s.label),
          next[0]?.prompt,
        );
        return next;
      });
    },
    [setBusinessSelections],
  );

  const onContinue = useCallback(async () => {
    if (selections.length === 0 || pending) return;
    setCommitted(true);
    const prompt = fsBuildMultiPrompt(selections);
    await refineUnderstanding(prompt, {
      businessTypes: selections.map((s) => s.label),
    });
  }, [selections, pending, refineUnderstanding]);

  const onBackToCategories = useCallback(() => {
    pauseConsultationKeepBusinesses();
    setCommitted(false);
    setDiscoveryKey((k) => k + 1);
    // Keep selections — re-sync labels into memory after pause
    window.setTimeout(() => {
      setBusinessSelections(
        selections.map((s) => s.label),
        selections[0]?.prompt,
      );
      document
        .getElementById("fs-guided-anchor")
        ?.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "center",
        });
    }, 40);
  }, [
    pauseConsultationKeepBusinesses,
    setBusinessSelections,
    selections,
    reducedMotion,
  ]);

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
                  selections={selections}
                  disabled={!hydrated || pending}
                  onToggleIndustry={onToggleIndustry}
                  onRemoveSelection={onRemoveSelection}
                  onContinue={() => void onContinue()}
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
