import { SparkMark } from "@/components/brand/marks";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Globe,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon?: LucideIcon;
  spark?: boolean;
};

const features: Feature[] = [
  {
    icon: Zap,
    title: "Lightning fast",
    description:
      "Book appointments in seconds. No clunky forms, no unnecessary steps.",
  },
  {
    spark: true,
    title: "AI that removes work",
    description:
      "Reminders, suggestions, and automation powered by The Spark — never invented availability.",
  },
  {
    icon: Calendar,
    title: "Unified calendar",
    description:
      "Sync with Google, Outlook, and Apple Calendar. One source of truth.",
  },
  {
    icon: Clock,
    title: "Smart availability",
    description:
      "Set buffers, working hours, and time zones. Chasum handles the complexity.",
  },
  {
    icon: Globe,
    title: "Beautiful booking pages",
    description:
      "Share a branded link that looks great on every device, in every language.",
  },
  {
    icon: Shield,
    title: "Enterprise-ready",
    description:
      "Multi-location foundations with tenant isolation built for growth.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Everything you need to run the business
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built as an operating system — not a single-purpose booking widget.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/60 bg-card/80 transition-all duration-300 hover:border-primary/30 hover:shadow-md"
            >
              <CardContent className="p-6">
                <div
                  className={
                    feature.spark
                      ? "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-spark text-spark-foreground"
                      : "mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                  }
                >
                  {feature.spark ? (
                    <SparkMark className="h-5 w-5" />
                  ) : (
                    feature.icon && <feature.icon className="h-5 w-5" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
