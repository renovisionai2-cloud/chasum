"use client";

import { ConnectedOperatingSystemAnimation } from "@/components/landing/connected-operating-system-animation";
import { Reveal } from "@/components/landing/reveal";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

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
 * The disconnected business — problem → signature connection visual.
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
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-14 xl:gap-16">
        <Reveal>
          <div className="mx-auto max-w-xl lg:mx-0">
            <h2
              id="disconnected-heading"
              className="text-balance text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl md:text-[2.75rem] md:leading-[1.12]"
            >
              Every business is already full of software.
            </h2>
            <ul className="mt-8 space-y-2.5 text-lg leading-snug text-muted-foreground md:text-xl">
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
          <ConnectedOperatingSystemAnimation active={active} />

          <p className="mt-10 text-center text-lg font-semibold tracking-tight text-foreground md:mt-12 md:text-xl lg:text-2xl">
            Understanding begins when everything works together.
          </p>
        </div>
      </div>
    </section>
  );
}
