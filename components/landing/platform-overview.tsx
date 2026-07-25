import { Reveal } from "@/components/landing/reveal";
import {
  APPLY_HREF,
  CTA_APPLY_LABEL,
  CTA_MEET_SUMMER_LABEL,
  MEET_SUMMER_HREF,
} from "@/lib/marketing/alpha";
import { PLATFORM_CATEGORIES } from "@/lib/marketing/homepage";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  MessageSquareText,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Scheduling & Reception": CalendarDays,
  "Customers & CRM": Users,
  "Team & Locations": Building2,
  Communication: MessageSquareText,
  Commerce: CreditCard,
  Reports: BarChart3,
  "AI Assistance": Sparkles,
};

/**
 * One connected platform — category story without duplicate product demos.
 */
export function PlatformOverview() {
  return (
    <section
      id="platform"
      className="marketing-section-contain scroll-mt-24 overflow-hidden px-6 py-24 md:py-36"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="marketing-eyebrow">One connected platform</p>
            <h2 id="platform-heading" className="marketing-h2-xl">
              Everything your service business needs to run the day.
            </h2>
            <p className="marketing-lede">
              Begin with the work your team already does. Chasum keeps each
              department connected instead of turning the business into another
              collection of tabs and tools.
            </p>
          </div>
        </Reveal>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PLATFORM_CATEGORIES.map((category, index) => {
            const Icon = CATEGORY_ICONS[category.name] ?? Sparkles;
            return (
              <Reveal key={category.name} delayMs={Math.min(index * 40, 160)}>
                <li
                  id={`platform-${category.id}`}
                  className="flex h-full scroll-mt-24 flex-col rounded-2xl border border-border/60 bg-card/70 p-6"
                >
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </p>
                </li>
              </Reveal>
            );
          })}
        </ul>

        <Reveal delayMs={120}>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={APPLY_HREF}
              className="marketing-focus-ring inline-flex h-11 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground"
            >
              {CTA_APPLY_LABEL}
            </Link>
            <Link
              href={MEET_SUMMER_HREF}
              className="marketing-focus-ring inline-flex h-11 items-center rounded-full border border-border px-7 text-sm font-semibold text-foreground"
            >
              {CTA_MEET_SUMMER_LABEL}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
