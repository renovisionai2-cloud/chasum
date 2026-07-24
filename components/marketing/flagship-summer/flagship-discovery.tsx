"use client";

import { SummerOrb } from "@/components/marketing/flagship-summer/summer-orb";
import {
  FS_AWAKENING,
  FS_BUSINESS_CATEGORIES,
  FS_GUIDED,
  type FsBusinessCategory,
  type FsBusinessIndustry,
  type FsSelectedBusiness,
} from "@/lib/marketing/flagship-summer";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Camera,
  Car,
  Check,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  PawPrint,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
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

type BrowsePhase = "intro" | "ready" | "industries";

/**
 * Fast-paced multi-business discovery — editable selections, never locked.
 */
export function FlagshipDiscovery({
  selections,
  disabled,
  onToggleIndustry,
  onRemoveSelection,
  onContinue,
  resumeAtChoices = false,
}: {
  selections: FsSelectedBusiness[];
  disabled?: boolean;
  onToggleIndustry: (
    industry: FsBusinessIndustry,
    categoryId: string,
  ) => void;
  onRemoveSelection: (id: string) => void;
  onContinue: () => void;
  resumeAtChoices?: boolean;
}) {
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  const [phase, setPhase] = useState<BrowsePhase>(
    resumeAtChoices ? "ready" : "intro",
  );
  const [introVisible, setIntroVisible] = useState(resumeAtChoices);
  const [visibleCategories, setVisibleCategories] = useState(
    resumeAtChoices ? FS_BUSINESS_CATEGORIES.length : 0,
  );
  const [selectedCategory, setSelectedCategory] =
    useState<FsBusinessCategory | null>(null);

  useEffect(() => {
    if (resumeAtChoices) return;

    const timers: number[] = [];

    if (reducedMotion) {
      timers.push(
        window.setTimeout(() => {
          setIntroVisible(true);
          setVisibleCategories(FS_BUSINESS_CATEGORIES.length);
          setPhase("ready");
        }, 0),
      );
      return () => {
        for (const t of timers) window.clearTimeout(t);
      };
    }

    timers.push(
      window.setTimeout(() => setIntroVisible(true), FS_GUIDED.introFadeMs),
    );
    timers.push(
      window.setTimeout(() => setPhase("ready"), FS_GUIDED.readyMs),
    );

    FS_BUSINESS_CATEGORIES.forEach((_, i) => {
      timers.push(
        window.setTimeout(
          () => setVisibleCategories(i + 1),
          FS_GUIDED.readyMs + i * FS_GUIDED.categoryStaggerMs,
        ),
      );
    });

    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [reducedMotion, resumeAtChoices]);

  function chooseCategory(category: FsBusinessCategory) {
    if (disabled) return;
    setSelectedCategory(category);
    setPhase("industries");
  }

  function backToCategories() {
    setSelectedCategory(null);
    setPhase("ready");
    setVisibleCategories(FS_BUSINESS_CATEGORIES.length);
  }

  function addAnotherCategory() {
    backToCategories();
  }

  const selectedIds = new Set(selections.map((s) => s.id));
  const showCategories = phase === "ready" || phase === "industries";
  const showIndustries = phase === "industries" && !!selectedCategory;

  return (
    <section
      className="fs-scene fs-guided"
      aria-labelledby="fs-guided-title"
      aria-live="polite"
    >
      <div
        className={cn(
          "fs-guided-intro fs-guided-intro-fast",
          introVisible && "fs-guided-intro-visible",
        )}
      >
        <SummerOrb size="xl" active cinematic className="fs-guided-orb" />
        <div className="fs-guided-speech">
          <p className="fs-scene-kicker">Summer</p>
          <h2 id="fs-guided-title" className="sr-only">
            Guided business discovery
          </h2>
          <div className="fs-awaken-block">
            <p className="fs-awaken-line fs-guided-line-visible">
              {FS_AWAKENING.greeting}
            </p>
            <p className="fs-awaken-line fs-awaken-body fs-guided-line-visible">
              {FS_AWAKENING.body}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "fs-guided-question",
          introVisible && "fs-guided-question-visible",
        )}
      >
        <p className="fs-guided-question-text">{FS_GUIDED.question}</p>
        <p className="fs-guided-explain fs-guided-explain-soft">
          {FS_GUIDED.industryPrompt}
        </p>
      </div>

      {selections.length > 0 ? (
        <div
          className="fs-selected-summary"
          aria-label={FS_GUIDED.selectedSummary}
        >
          <p className="fs-selected-summary-label">{FS_GUIDED.selectedSummary}</p>
          <ul className="fs-selected-chips">
            {selections.map((item) => (
              <li key={item.id}>
                <span className="fs-selected-chip">
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  <span>{item.label}</span>
                  <button
                    type="button"
                    className="fs-selected-chip-remove"
                    aria-label={`Remove ${item.label}`}
                    disabled={disabled}
                    onClick={() => onRemoveSelection(item.id)}
                  >
                    <X className="size-3.5" strokeWidth={2.5} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showCategories ? (
        <div
          className={cn(
            "fs-path-grid fs-guided-choices",
            phase === "industries" && "fs-guided-choices-narrow",
          )}
          role="list"
        >
          {FS_BUSINESS_CATEGORIES.map((category, index) => {
            const Icon = CATEGORY_ICONS[category.id] ?? MoreHorizontal;
            const revealed = index < visibleCategories;
            const active = selectedCategory?.id === category.id;
            const hasPick = selections.some((s) => s.categoryId === category.id);
            const hideOthers =
              phase === "industries" &&
              selectedCategory &&
              selectedCategory.id !== category.id;

            if (hideOthers) return null;

            return (
              <div
                key={category.id}
                role="listitem"
                className={cn(
                  "fs-path-card-wrap fs-guided-cat",
                  revealed && "fs-guided-cat-visible",
                )}
              >
                <button
                  type="button"
                  className={cn(
                    "fs-path-card",
                    active && "fs-path-card-active",
                    hasPick && "fs-path-card-has-pick",
                  )}
                  disabled={disabled || phase === "industries"}
                  aria-pressed={active}
                  onClick={() => chooseCategory(category)}
                >
                  <span className="fs-path-icon" aria-hidden>
                    <Icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <span className="fs-path-copy">
                    <span className="fs-path-label">{category.label}</span>
                    <span className="fs-path-blurb">{category.blurb}</span>
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {showIndustries && selectedCategory ? (
        <div
          className="fs-industry-panel"
          role="region"
          aria-label={`${selectedCategory.label} industries`}
        >
          <p className="fs-industry-prompt">
            Which {selectedCategory.label.toLowerCase()} businesses do you
            operate?
          </p>
          <ul className="fs-industry-grid">
            {selectedCategory.industries.map((industry) => {
              const selected = selectedIds.has(industry.id);
              return (
                <li key={industry.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    className={cn(
                      "fs-industry-chip",
                      selected && "fs-industry-chip-selected",
                    )}
                    onClick={() =>
                      onToggleIndustry(industry, selectedCategory.id)
                    }
                  >
                    <span
                      className={cn(
                        "fs-cat-check",
                        selected && "fs-cat-check-on",
                      )}
                      aria-hidden
                    >
                      {selected ? (
                        <Check className="size-3" strokeWidth={2.5} />
                      ) : null}
                    </span>
                    <span>{industry.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="fs-selection-actions">
            <button
              type="button"
              className="fs-industry-back"
              onClick={backToCategories}
            >
              {FS_GUIDED.backToCategories}
            </button>
            <button
              type="button"
              className="fs-selection-secondary"
              onClick={addAnotherCategory}
            >
              {FS_GUIDED.chooseAnotherCategory}
            </button>
          </div>
        </div>
      ) : null}

      <div className="fs-selection-footer">
        <button
          type="button"
          className="fs-cta fs-selection-continue"
          disabled={disabled || selections.length === 0}
          onClick={onContinue}
        >
          {FS_GUIDED.continueWithSelections}
        </button>
        {selections.length > 0 ? (
          <p className="fs-selection-hint">
            {selections.length === 1
              ? "1 business selected — add more from any category, or continue."
              : `${selections.length} businesses selected — you can keep adding or continue.`}
          </p>
        ) : (
          <p className="fs-selection-hint">
            Select at least one business to continue.
          </p>
        )}
      </div>
    </section>
  );
}
