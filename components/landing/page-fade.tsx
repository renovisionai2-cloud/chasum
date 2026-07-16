"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Soft page entrance for marketing routes. */
export function PageFade({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={
        reduced || ready
          ? "translate-y-0 opacity-100 transition-[opacity,transform] duration-700 ease-out"
          : "translate-y-2 opacity-0"
      }
    >
      {children}
    </div>
  );
}
