"use client";

import { Reveal } from "@/components/landing/reveal";
import { FS_BUSINESS_CATEGORIES } from "@/lib/marketing/flagship-summer";
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
import { useId, useState } from "react";

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

/**
 * Phase 8 — premium category accordion for Business Discovery.
 * Selection still routes through the existing Discovery Engine via onSelect → send().
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
  const [openId, setOpenId] = useState<string | null>(
    FS_BUSINESS_CATEGORIES[0]?.id ?? null,
  );

  function toggleCategory(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section className="fs-scene" aria-labelledby="fs-discovery-title">
      <Reveal>
        <p className="fs-scene-kicker">Business discovery</p>
        <h2 id="fs-discovery-title" className="fs-scene-title">
          What kind of business do you own?
        </h2>
        <p className="fs-scene-lede">
          Choose a category, then your industry. Summer begins understanding
          from there — calmly, one step at a time.
        </p>
      </Reveal>

      <div className="fs-cat-list" role="list">
        {FS_BUSINESS_CATEGORIES.map((category) => {
          const Icon = CATEGORY_ICONS[category.id] ?? MoreHorizontal;
          const open = openId === category.id;
          const panelId = `${baseId}-${category.id}-panel`;
          const headerId = `${baseId}-${category.id}-header`;
          const hasSelected = category.industries.some(
            (industry) => industry.id === selectedId,
          );

          return (
            <div
              key={category.id}
              role="listitem"
              className={cn(
                "fs-cat",
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
                      const selected = selectedId === industry.id;
                      return (
                        <li key={industry.id}>
                          <button
                            type="button"
                            disabled={disabled}
                            tabIndex={open ? 0 : -1}
                            aria-pressed={selected}
                            className={cn(
                              "fs-cat-industry",
                              selected && "fs-cat-industry-selected",
                            )}
                            onClick={() => onSelect(industry.prompt, industry.id)}
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
    </section>
  );
}
