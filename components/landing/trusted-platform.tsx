"use client";

import { Reveal } from "@/components/landing/reveal";
import { LogoIcon } from "@/components/brand/logo";
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  MessageSquare,
  Users,
  UserCog,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const SYSTEMS = [
  { label: "Scheduling", icon: CalendarDays },
  { label: "Customers", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Employees", icon: UserCog },
  { label: "Communication", icon: MessageSquare },
  { label: "Reporting", icon: BarChart3 },
] as const;

const LIST = [
  "Appointments.",
  "Customers.",
  "Payments.",
  "Employees.",
  "Communication.",
  "Reports.",
] as const;

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The disconnected business — problem → connection visual.
 */
export function TrustedPlatform() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );
  const active = reducedMotion || visible;

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <section
      id="why-chasum"
      className="scroll-mt-24 px-5 py-20 sm:px-6 md:py-28 lg:px-8"
      aria-labelledby="disconnected-heading"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="max-w-xl">
            <h2
              id="disconnected-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.12]"
            >
              Every business is already full of software.
            </h2>
            <ul className="mt-8 space-y-2 text-lg text-muted-foreground md:text-xl">
              {LIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Different software.
              <br />
              Different answers.
              <br />
              <span className="font-semibold text-foreground">Until now.</span>
            </p>
          </div>
        </Reveal>

        <div
          ref={ref}
          className="fd-connect relative mx-auto w-full max-w-md lg:max-w-lg"
          data-active={active ? "true" : "false"}
          aria-hidden
        >
          <div className="relative aspect-square w-full">
            {SYSTEMS.map((system, index) => {
              const angle = (index / SYSTEMS.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 42;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              const Icon = system.icon;
              return (
                <div key={system.label}>
                  <svg
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    fill="none"
                  >
                    <line
                      x1={x}
                      y1={y}
                      x2="50"
                      y2="50"
                      className="fd-connect-line stroke-primary/35"
                      strokeWidth="0.35"
                      strokeDasharray="1.2 1.2"
                      style={{ ["--i" as string]: index }}
                    />
                  </svg>
                  <div
                    className="fd-connect-node absolute flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border border-border/70 bg-card/90 shadow-sm backdrop-blur-sm sm:h-16 sm:w-16"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      ["--i" as string]: index,
                    }}
                  >
                    <Icon className="h-4 w-4 text-primary sm:h-5 sm:w-5" strokeWidth={1.75} />
                    <span className="mt-0.5 max-w-[3.5rem] truncate text-[9px] font-medium text-muted-foreground sm:text-[10px]">
                      {system.label}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="fd-connect-core absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/30 bg-card shadow-[0_0_48px_-6px_hsl(var(--primary)/0.65)] sm:h-28 sm:w-28">
              <LogoIcon size={48} className="sm:h-14 sm:w-14" />
            </div>
          </div>

          <p className="mt-10 text-center text-lg font-semibold tracking-tight text-foreground md:mt-12 md:text-xl lg:text-2xl">
            Understanding begins when everything works together.
          </p>
        </div>
      </div>
    </section>
  );
}
