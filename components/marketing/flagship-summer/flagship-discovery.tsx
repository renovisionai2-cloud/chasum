"use client";

import { Reveal } from "@/components/landing/reveal";
import { FS_BUSINESS_TYPES } from "@/lib/marketing/flagship-summer";
import { cn } from "@/lib/utils";
import {
  Activity,
  Building2,
  Dog,
  Dumbbell,
  Hand,
  HeartPulse,
  Scissors,
  Sparkles,
  Stethoscope,
  Waves,
} from "lucide-react";

const ICONS = {
  ultrasound: HeartPulse,
  salon: Scissors,
  spa: Waves,
  massage: Hand,
  chiropractic: Activity,
  dental: Sparkles,
  veterinary: Stethoscope,
  fitness: Dumbbell,
  pet_grooming: Dog,
  other: Building2,
} as const;

export function FlagshipDiscovery({
  selectedId,
  disabled,
  onSelect,
}: {
  selectedId: string | null;
  disabled?: boolean;
  onSelect: (prompt: string, id: string) => void;
}) {
  return (
    <section className="fs-scene" aria-labelledby="fs-discovery-title">
      <Reveal>
        <p className="fs-scene-kicker">Business discovery</p>
        <h2 id="fs-discovery-title" className="fs-scene-title">
          What kind of business do you own?
        </h2>
        <p className="fs-scene-lede">
          Choose one. Summer will continue discovering from there — one calm
          question at a time.
        </p>
      </Reveal>

      <ul className="fs-type-grid">
        {FS_BUSINESS_TYPES.map((type, i) => {
          const Icon = ICONS[type.id];
          const selected = selectedId === type.id;
          return (
            <Reveal key={type.id} delayMs={(i % 5) * 40}>
              <li>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(type.prompt, type.id)}
                  className={cn("fs-type-card", selected && "fs-type-card-selected")}
                  aria-pressed={selected}
                >
                  <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                  <span>{type.label}</span>
                </button>
              </li>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
