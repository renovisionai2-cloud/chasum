"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import {
  FS_AWAKENING,
  FS_BUSINESS_CATEGORIES,
  FS_GUIDED,
  fsAckBusinessLine,
  type FsBusinessIndustry,
} from "@/lib/marketing/flagship-summer";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Camera,
  Car,
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

type GuidedPhase = "intro" | "question" | "choices" | "ack" | "committed";

/**
 * Phase 8.1 — Guided Business Discovery.
 * Conversational progressive reveal; selection still feeds the Discovery Engine.
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
  const committedRef = useRef(false);

  // Intro → question → choices timeline (timers only — no sync setState)
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
      window.setTimeout(() => {
        setPhase("question");
      }, afterIntro),
    );

    timers.push(
      window.setTimeout(() => {
        setPhase("choices");
      }, afterIntro + FS_GUIDED.choicesPauseMs),
    );

    FS_BUSINESS_CATEGORIES.forEach((_, i) => {
      timers.push(
        window.setTimeout(
          () => {
            setVisibleCategories(i + 1);
          },
          afterIntro + FS_GUIDED.choicesPauseMs + i * FS_GUIDED.categoryStaggerMs,
        ),
      );
    });

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [reducedMotion]);

  // Acknowledgment → commit to Discovery Engine
  useEffect(() => {
    if (phase !== "ack" || !pendingIndustry || committedRef.current) return;

    const timers: number[] = [];

    if (reducedMotion) {
      timers.push(
        window.setTimeout(() => {
          if (committedRef.current) return;
          committedRef.current = true;
          setAckStep(3);
          setPhase("committed");
          onSelect(pendingIndustry.prompt, pendingIndustry.id);
        }, 0),
      );
      return () => {
        for (const t of timers) window.clearTimeout(t);
      };
    }

    timers.push(
      window.setTimeout(() => setAckStep(1), 40),
    );
    timers.push(
      window.setTimeout(() => setAckStep(2), 40 + FS_GUIDED.ackGapMs),
    );
    timers.push(
      window.setTimeout(() => setAckStep(3), 40 + FS_GUIDED.ackGapMs * 2),
    );
    timers.push(
      window.setTimeout(() => {
        if (committedRef.current) return;
        committedRef.current = true;
        setPhase("committed");
        onSelect(pendingIndustry.prompt, pendingIndustry.id);
      }, 40 + FS_GUIDED.ackGapMs * 2 + FS_GUIDED.ackCommitMs),
    );

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [phase, pendingIndustry, reducedMotion, onSelect]);

  function toggleCategory(id: string) {
    if (phase === "ack" || phase === "committed") return;
    setOpenId((prev) => (prev === id ? null : id));
  }

  function selectIndustry(industry: FsBusinessIndustry) {
    if (phase === "ack" || phase === "committed" || disabled) return;
    setPendingIndustry(industry);
    setOpenId(null);
    setPhase("ack");
    setAckStep(0);
  }

  const activeSelectedId = selectedId ?? pendingIndustry?.id ?? null;
  const showQuestion = phase !== "intro";
  const showChoices =
    phase === "choices" || phase === "ack" || phase === "committed";

  return (
    <section
      className={cn(
        "fs-scene fs-guided",
        phase === "ack" && "fs-guided-acking",
        phase === "committed" && "fs-guided-committed",
      )}
      aria-labelledby="fs-guided-title"
      aria-live="polite"
    >
      <div className="fs-guided-intro">
        <SummerOrb size="xl" active cinematic className="fs-guided-orb" />
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
            (phase === "ack" || phase === "committed") && "fs-guided-choices-dim",
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
                  disabled={phase === "ack" || phase === "committed"}
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
                              disabled={
                                disabled ||
                                phase === "ack" ||
                                phase === "committed"
                              }
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

      {phase === "ack" || phase === "committed" ? (
        <div className="fs-guided-ack" aria-live="polite">
          <p
            className={cn(
              "fs-guided-ack-line",
              ackStep >= 1 && "fs-guided-ack-visible",
            )}
          >
            {FS_GUIDED.ackLead}
          </p>
          {pendingIndustry ? (
            <p
              className={cn(
                "fs-guided-ack-line",
                ackStep >= 2 && "fs-guided-ack-visible",
              )}
            >
              {fsAckBusinessLine(pendingIndustry.label)}
            </p>
          ) : null}
          <p
            className={cn(
              "fs-guided-ack-line fs-guided-ack-soft",
              ackStep >= 3 && "fs-guided-ack-visible",
            )}
          >
            {FS_GUIDED.ackMore}
          </p>
        </div>
      ) : null}
    </section>
  );
}
