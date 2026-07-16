import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui/button";
import { PLATFORM_MODULES } from "@/lib/marketing/homepage";
import { ArrowRight } from "lucide-react";
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
      className="scroll-mt-20 px-6 py-20 md:py-28"
      aria-labelledby="platform-heading"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="platform-heading"
              className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            >
              Real departments. One operating system.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Chasum ships the same modules you run in the dashboard — not generic
              SaaS feature cards.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 space-y-20">
          {PLATFORM_MODULES.map((mod, index) => {
            const reverse = index % 2 === 1;
            return (
              <Reveal key={mod.id} delayMs={40}>
                <article
                  id={`platform-${mod.id}`}
                  className="scroll-mt-24 grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
                >
                  <div className={reverse ? "lg:order-2" : undefined}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-semibold tracking-tight">
                        {mod.name}
                      </h3>
                      {mod.comingSoon ? (
                        <span className="rounded-full bg-spark-muted px-2.5 py-0.5 text-xs font-medium text-spark">
                          Coming Soon
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-base font-medium text-foreground">
                      {mod.benefit}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {mod.explanation}
                    </p>
                    <Link href={mod.ctaHref} className="mt-6 inline-block">
                      <Button variant={mod.comingSoon ? "outline" : "primary"}>
                        {mod.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className={reverse ? "lg:order-1" : undefined}>
                    <DashboardPreview variant={previewFor(mod.preview)} compact />
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
