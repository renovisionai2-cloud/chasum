import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  Calendar,
  Clock,
  Globe,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning fast",
    description:
      "Book appointments in seconds. No clunky forms, no unnecessary steps.",
  },
  {
    icon: Bot,
    title: "AI-powered",
    description:
      "Smart scheduling suggestions, automated reminders, and intelligent availability.",
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
      "SOC 2 compliant infrastructure with end-to-end encryption for your data.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            Everything you need, nothing you don&apos;t
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Built for speed and simplicity. Chasum strips away the complexity
            so you can focus on your clients.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/60 bg-card/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" />
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
