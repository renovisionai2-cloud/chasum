import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  CreditCard,
  MessageSquareText,
  Sparkles,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

type PreviewVariant =
  | "overview"
  | "reception"
  | "crm"
  | "reports"
  | "emma"
  | "employees"
  | "business"
  | "communication"
  | "billing";

const MODULE_ICONS: Record<string, LucideIcon> = {
  emma: Sparkles,
  crm: Users,
  calendar: CalendarDays,
  employees: UserCog,
  business: Building2,
  reports: BarChart3,
  communication: MessageSquareText,
  billing: CreditCard,
  workforce: Sparkles,
};

function previewFor(
  preview: (typeof PLATFORM_MODULES)[number]["preview"],
): PreviewVariant {
  switch (preview) {
    case "calendar":
      return "reception";
    case "crm":
      return "crm";
    case "communication":
      return "communication";
    case "reports":
      return "reports";
    case "billing":
      return "billing";
    case "employees":
      return "employees";
    case "business":
      return "business";
    case "emma":
    case "workforce":
      return "emma";
    default:
      return "overview";
  }
}

export function PlatformOverview() {
  return (
    <section
      id="platform"
      className="marketing-surface-tint marketing-hairline-y scroll-mt-20 px-6 py-24 md:py-36"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">The platform</p>
            <h2 id="platform-heading" className="marketing-h2">
              Real departments. One operating system.
            </h2>
            <p className="marketing-lede">
              Chasum ships the same modules you run in the dashboard — not generic
              SaaS feature cards.
            </p>
          </div>
        </Reveal>

        <div className="mt-20 space-y-28">
          {PLATFORM_MODULES.map((mod, index) => {
            const reverse = index % 2 === 1;
            const Icon = MODULE_ICONS[mod.id] ?? Sparkles;
            return (
              <Reveal key={mod.id} delayMs={40}>
                <article
                  id={`platform-${mod.id}`}
                  className="scroll-mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                >
                  <div className={reverse ? "lg:order-2" : undefined}>
                    <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-spark/15 text-primary shadow-sm">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold tracking-tight md:text-3xl">
                        {mod.name}
                      </h3>
                      {mod.comingSoon ? (
                        <span className="rounded-full bg-spark-muted px-2.5 py-0.5 text-xs font-medium text-spark">
                          Coming Soon
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 text-base font-medium text-foreground md:text-lg">
                      {mod.benefit}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                      {mod.explanation}
                    </p>
                    <Link href={mod.ctaHref} className="mt-8 inline-block">
                      <Button
                        size="lg"
                        variant={mod.comingSoon ? "outline" : "primary"}
                        className="marketing-cta-button min-h-12"
                      >
                        {mod.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className={reverse ? "lg:order-1" : undefined}>
                    <DashboardPreview
                      variant={previewFor(mod.preview)}
                      compact
                      live={false}
                    />
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
