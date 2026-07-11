import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-16 md:pb-32 md:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="absolute -right-32 top-32 h-64 w-64 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          AI-powered scheduling for modern teams
        </div>

        <h1 className="animate-fade-in-up animation-delay-100 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.1]">
          Appointment booking,{" "}
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            reimagined
          </span>
        </h1>

        <p className="animate-fade-in-up animation-delay-200 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Chasum is the fastest, cleanest way to schedule appointments. Set up
          in minutes, share your link, and let AI handle the rest.
        </p>

        <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup">
            <Button size="lg" className="min-w-[180px]">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/#how-it-works">
            <Button variant="outline" size="lg" className="min-w-[180px]">
              See how it works
            </Button>
          </Link>
        </div>

        <p className="animate-fade-in-up animation-delay-400 mt-6 text-sm text-muted-foreground">
          No credit card required · Free plan available
        </p>
      </div>

      <div className="animate-fade-in-up animation-delay-400 mx-auto mt-16 max-w-5xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/5 dark:shadow-black/40">
          <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
            <div className="h-3 w-3 rounded-full bg-red-400/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
            <div className="h-3 w-3 rounded-full bg-green-400/80" />
            <span className="ml-2 text-xs text-muted-foreground">
              chasum.app/book/your-business
            </span>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
            <div className="space-y-4">
              <div className="h-4 w-32 rounded-md bg-muted" />
              <div className="h-3 w-full rounded-md bg-muted/70" />
              <div className="h-3 w-4/5 rounded-md bg-muted/70" />
              <div className="mt-6 grid grid-cols-3 gap-2">
                {["9:00", "10:30", "2:00", "3:30", "4:00", "5:30"].map(
                  (time) => (
                    <div
                      key={time}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {time}
                    </div>
                  ),
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-xl bg-accent/50 p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-accent-foreground">
                AI suggested the best times based on your calendar and client
                preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
