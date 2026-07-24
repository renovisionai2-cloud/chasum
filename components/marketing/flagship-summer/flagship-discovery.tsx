"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import {
  FS_AWAKENING,
  FS_BUSINESS_CATEGORIES,
  FS_GUIDED,
  fsBuildAckLines,
  type FsBusinessIndustry,
} from "@/lib/marketing/flagship-summer";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Camera,
  Car,
  Check,
  ChevronDown,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  PawPrint,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  healthcare: HeartPulse,
  beauty: Sparkles,
  fitness: Dumbbell,
  pet: PawPrint,
  automotive: Car,
  home: Home,
  professional: Briefcase,
  creative: Camera,
  education: GraduationCap,
  other: MoreHorizontal,
};

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type GuidedPhase =
  | "intro"
  | "question"
  | "choices"
  | "ack"
  | "intelligence"
  | "committed";

/**
 * Phase 8 — Guided Business Discovery consultation.
 * Progressive reveal + intelligence moment; engines unchanged.
 */
export function FlagshipDiscovery({
  selectedId,
  disabled,
  onSelect,
}: {
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (prompt: string, id: string) => void;
}) {
  const baseId = useId();
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const [phase, setPhase] = useState<GuidedPhase>("intro");
  const [visibleLines, setVisibleLines] = useState(0);
  const [visibleCategories, setVisibleCategories] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingIndustry, setPendingIndustry] =
    useState<FsBusinessIndustry | null>(null);
  const [ackStep, setAckStep] = useState(0);
  const [intelStep, setIntelStep] = useState(0);
  const committedRef = useRef(false);

  const ackLines = useMemo(
    () => (pendingIndustry ? fsBuildAckLines(pendingIndustry.label) : []),
    [pendingIndustry],
  );

  // Intro → question → choices
  useEffect(() => {
    const timers: number[] = [];

    if (reducedMotion) {
      timers.push(
        window.setTimeout(() => {
          setVisibleLines(FS_AWAKENING.lines.length);
          setVisibleCategories(FS_BUSINESS_CATEGORIES.length);
          setPhase("choices");
        }, 0),
      );
      return () => {
        for (const t of timers) window.clearTimeout(t);
      };
    }

    const lines = FS_AWAKENING.lines;

    for (let i = 0; i < lines.length; i += 1) {
      timers.push(
        window.setTimeout(() => {
          setVisibleLines(i + 1);
        }, i * FS_GUIDED.lineGapMs),
      );
    }

    const afterIntro =
      (lines.length - 1) * FS_GUIDED.lineGapMs + FS_GUIDED.questionPauseMs;

    timers.push(
      window.setTimeout(() => setPhase("question"), afterIntro),
    );

    timers.push(
      window.setTimeout(
        () => setPhase("choices"),
        afterIntro + FS_GUIDED.choicesPauseMs,
      ),
    );

    FS_BUSINESS_CATEGORIES.forEach((_, i) => {
      timers.push(
        window.setTimeout(
          () => setVisibleCategories(i + 1),
          afterIntro +
            FS_GUIDED.choicesPauseMs +
            i * FS_GUIDED.categoryStaggerMs,
        ),
      );
    });

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [reducedMotion]);

  // Acknowledgment beat sheet
  useEffect(() => {
    if (phase !== "ack" || !pendingIndustry || ackLines.length === 0) return;

    const timers: number[] = [];

    if (reducedMotion) {
      timers.push(
        window.setTimeout(() => {
          setAckStep(ackLines.length);
          setPhase("intelligence");
        }, 0),
      );
      return () => {
        for (const t of timers) window.clearTimeout(t);
      };
    }

    for (let i = 0; i < ackLines.length; i += 1) {
      timers.push(
        window.setTimeout(() => setAckStep(i + 1), 40 + i * FS_GUIDED.ackGapMs),
      );
    }

    timers.push(
      window.setTimeout(
        () => setPhase("intelligence"),
        40 + ackLines.length * FS_GUIDED.ackGapMs,
      ),
    );

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [phase, pendingIndustry, ackLines, reducedMotion]);

  // Intelligence moment → commit to Discovery Engine
  useEffect(() => {
    if (phase !== "intelligence" || !pendingIndustry || committedRef.current) {
      return;
    }

    const timers: number[] = [];
    const steps = FS_GUIDED.intelligenceSteps;

    if (reducedMotion) {
      timers.push(
        window.setTimeout(() => {
          if (committedRef.current) return;
          committedRef.current = true;
          setIntelStep(steps.length);
          setPhase("committed");
          onSelect(pendingIndustry.prompt, pendingIndustry.id);
        }, 0),
      );
      return () => {
        for (const t of timers) window.clearTimeout(t);
      };
    }

    for (let i = 0; i < steps.length; i += 1) {
      timers.push(
        window.setTimeout(
          () => setIntelStep(i + 1),
          60 + i * FS_GUIDED.intelligenceStepMs,
        ),
      );
    }

    timers.push(
      window.setTimeout(
        () => {
          if (committedRef.current) return;
          committedRef.current = true;
          setPhase("committed");
          onSelect(pendingIndustry.prompt, pendingIndustry.id);
        },
        60 + steps.length * FS_GUIDED.intelligenceStepMs + FS_GUIDED.ackCommitMs,
      ),
    );

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [phase, pendingIndustry, reducedMotion, onSelect]);

  function toggleCategory(id: string) {
    if (phase === "ack" || phase === "intelligence" || phase === "committed") {
      return;
    }
    setOpenId((prev) => (prev === id ? null : id));
  }

  function selectIndustry(industry: FsBusinessIndustry) {
    if (
      phase === "ack" ||
      phase === "intelligence" ||
      phase === "committed" ||
      disabled
    ) {
      return;
    }
    setPendingIndustry(industry);
    setOpenId(null);
    setPhase("ack");
    setAckStep(0);
    setIntelStep(0);
  }

  const activeSelectedId = selectedId ?? pendingIndustry?.id ?? null;
  const showQuestion = phase !== "intro";
  const showChoices =
    phase === "choices" ||
    phase === "ack" ||
    phase === "intelligence" ||
    phase === "committed";
  const locked =
    phase === "ack" || phase === "intelligence" || phase === "committed";
  const showIntel = phase === "intelligence" || phase === "committed";

  return (
    <section
      className={cn(
        "fs-scene fs-guided",
        locked && "fs-guided-locked",
        phase === "committed" && "fs-guided-committed",
      )}
      aria-labelledby="fs-guided-title"
      aria-live="polite"
    >
      <div className="fs-guided-intro">
        <SummerOrb
          size="xl"
          active
          cinematic
          className="fs-guided-orb"
        />
        <div className="fs-guided-speech">
          <p className="fs-scene-kicker">Summer</p>
          <h2 id="fs-guided-title" className="sr-only">
            Guided business discovery
          </h2>
          <div className="fs-awaken-lines">
            {FS_AWAKENING.lines.map((line, i) => (
              <p
                key={line}
                className={cn(
                  "fs-awaken-line fs-guided-line",
                  i < visibleLines && "fs-guided-line-visible",
                )}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fs-guided-question",
          showQuestion && "fs-guided-question-visible",
        )}
      >
        <p className="fs-guided-question-text">{FS_GUIDED.question}</p>
      </div>

      {showChoices ? (
        <div
          className={cn(
            "fs-cat-list fs-guided-choices",
            locked && "fs-guided-choices-dim",
          )}
          role="list"
        >
          {FS_BUSINESS_CATEGORIES.map((category, index) => {
            const Icon = CATEGORY_ICONS[category.id] ?? MoreHorizontal;
            const open = openId === category.id;
            const panelId = `${baseId}-${category.id}-panel`;
            const headerId = `${baseId}-${category.id}-header`;
            const hasSelected = category.industries.some(
              (industry) => industry.id === activeSelectedId,
            );
            const revealed = index < visibleCategories;

            return (
              <div
                key={category.id}
                role="listitem"
                className={cn(
                  "fs-cat fs-guided-cat",
                  revealed && "fs-guided-cat-visible",
                  open && "fs-cat-open",
                  hasSelected && "fs-cat-has-selection",
                )}
              >
                <button
                  type="button"
                  id={headerId}
                  className="fs-cat-header"
                  aria-expanded={open}
                  aria-controls={panelId}
                  disabled={locked}
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className="fs-cat-icon" aria-hidden>
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="fs-cat-label">{category.label}</span>
                  <span className="fs-cat-count" aria-hidden>
                    {category.industries.length}
                  </span>
                  <ChevronDown
                    className="fs-cat-chevron"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className="fs-cat-panel"
                  aria-hidden={!open}
                  inert={open ? undefined : true}
                >
                  <div className="fs-cat-panel-inner">
                    <ul className="fs-cat-industries">
                      {category.industries.map((industry) => {
                        const selected = activeSelectedId === industry.id;
                        return (
                          <li key={industry.id}>
                            <button
                              type="button"
                              disabled={disabled || locked}
                              tabIndex={open ? 0 : -1}
                              aria-pressed={selected}
                              className={cn(
                                "fs-cat-industry",
                                selected && "fs-cat-industry-selected",
                              )}
                              onClick={() => selectIndustry(industry)}
                            >
                              <span className="fs-cat-radio" aria-hidden />
                              <span>{industry.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {phase === "ack" || showIntel ? (
        <div className="fs-guided-ack" aria-live="polite">
          {ackLines.map((line, i) => (
            <p
              key={line}
              className={cn(
                "fs-guided-ack-line",
                i === ackLines.length - 1 && "fs-guided-ack-soft",
                i < ackStep && "fs-guided-ack-visible",
              )}
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {showIntel ? (
        <div className="fs-guided-intel" aria-live="polite">
          <p className="fs-scene-kicker">Visible intelligence</p>
          <ul className="fs-think-list fs-guided-intel-list">
            {FS_GUIDED.intelligenceSteps.map((step, i) => {
              const done = i < intelStep;
              const active = i === intelStep - 1 && intelStep < FS_GUIDED.intelligenceSteps.length;
              return (
                <li
                  key={step}
                  className={cn(
                    "fs-think-item",
                    done && "fs-think-item-done",
                    active && "fs-think-item-active",
                  )}
                >
                  <span className="fs-think-mark" aria-hidden>
                    {done ? (
                      <Check className="size-3.5" strokeWidth={2.5} />
                    ) : null}
                  </span>
                  <span>{step}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
