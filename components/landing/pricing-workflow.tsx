"use client";

import { Reveal } from "@/components/landing/reveal";
import {
  PRICING_WORKFLOW_BODY,
  PRICING_WORKFLOW_EYEBROW,
  PRICING_WORKFLOW_FOOTNOTE,
  PRICING_WORKFLOW_HEADLINE,
  PRICING_WORKFLOW_LINK_LABEL,
  PRICING_WORKFLOW_STEPS,
} from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  MessageSquare,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const ICONS = [
  UserRound,
  Sparkles,
  CalendarDays,
  CreditCard,
  MessageSquare,
  RefreshCw,
] as const;

const STEP_STAGGER_MS = 140;
const LINE_MS = 1200;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Automated workflow — bright, sequential, one-shot viewport story.
 */
export function PricingWorkflow() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );
  const show = active || reducedMotion;

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section
      ref={ref}
      id="workflow"
      className="scroll-mt-24 bg-background px-6 py-24 md:py-32"
      aria-labelledby="pricing-workflow-heading"
    >
      <style>{`
        @keyframes pricing-workflow-pulse {
          0% { offset-distance: 0%; opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="marketing-eyebrow">{PRICING_WORKFLOW_EYEBROW}</p>
            <h2
              id="pricing-workflow-heading"
              className="marketing-h2-xl"
            >
              {PRICING_WORKFLOW_HEADLINE}
            </h2>
            <p className="marketing-lede">{PRICING_WORKFLOW_BODY}</p>
          </div>
        </Reveal>

        {/* Desktop / tablet horizontal */}
        <div className="relative mt-16 hidden md:block md:mt-20">
          <svg
            className="pointer-events-none absolute left-[6%] right-[6%] top-[28px] h-2 w-[88%]"
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1="0"
              y1="2"
              x2="100"
              y2="2"
              className="stroke-border"
              strokeWidth="1.5"
              strokeDasharray="100"
              strokeDashoffset={show ? 0 : 100}
              pathLength={100}
              style={
                reducedMotion
                  ? undefined
                  : {
                      transition: `stroke-dashoffset ${LINE_MS}ms ${EASE}`,
                    }
              }
            />
            {show && !reducedMotion ? (
              <circle
                r="2.2"
                className="fill-primary"
                style={{
                  offsetPath: "path('M 0 2 L 100 2')",
                  animation: `pricing-workflow-pulse ${LINE_MS}ms ${EASE} 180ms both`,
                }}
              />
            ) : null}
          </svg>

          <ol className="relative grid grid-cols-6 gap-4">
            {PRICING_WORKFLOW_STEPS.map((step, index) => {
              const Icon = ICONS[index]!;
              return (
                <li
                  key={step.title}
                  className={cn(
                    "flex flex-col items-center text-center will-change-[opacity,transform]",
                    !reducedMotion && "transition-[opacity,transform]",
                    show
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0",
                  )}
                  style={
                    reducedMotion
                      ? undefined
                      : {
                          transitionDuration: "480ms",
                          transitionTimingFunction: EASE,
                          transitionDelay: show
                            ? `${220 + index * STEP_STAGGER_MS}ms`
                            : "0ms",
                        }
                  }
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border/80 bg-card text-primary shadow-sm">
                    <Icon className="h-5 w-5" strokeWidth={1.6} />
                  </span>
                  <p className="mt-4 text-sm font-semibold tracking-tight text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1.5 max-w-[11rem] text-xs leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile vertical timeline */}
        <ol className="relative mt-14 space-y-0 md:hidden">
          <div
            className="absolute bottom-3 left-[19px] top-3 w-px bg-border"
            aria-hidden
          />
          {PRICING_WORKFLOW_STEPS.map((step, index) => {
            const Icon = ICONS[index]!;
            return (
              <li
                key={step.title}
                className={cn(
                  "relative flex gap-4 pb-8 last:pb-0 will-change-[opacity,transform]",
                  !reducedMotion && "transition-[opacity,transform]",
                  show
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0",
                )}
                style={
                  reducedMotion
                    ? undefined
                    : {
                        transitionDuration: "450ms",
                        transitionTimingFunction: EASE,
                        transitionDelay: show
                          ? `${180 + index * STEP_STAGGER_MS}ms`
                          : "0ms",
                      }
                }
              >
                <span className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-primary">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <div className="pt-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mx-auto mt-16 max-w-xl text-center md:mt-20">
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            {PRICING_WORKFLOW_FOOTNOTE}
          </p>
          <Link
            href="#compare-plans"
            className="marketing-focus-ring mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
          >
            {PRICING_WORKFLOW_LINK_LABEL}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
