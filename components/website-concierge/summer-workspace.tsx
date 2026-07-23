"use client";

import { SummerEmbeddedPanel } from "@/components/website-concierge/summer-embedded-panel";
import { SummerUnderstandingPanel } from "@/components/website-concierge/summer-understanding-panel";
import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { MEET_SUMMER_VISIBLE_INTEL } from "@/lib/marketing/meet-summer";
import { cn } from "@/lib/utils";

/**
 * Chapters 02–06 — Summer appears, discovers, shows intelligence, understands, recommends.
 * Presentation rebuild; engines unchanged.
 */
export function SummerWorkspace({ className }: { className?: string }) {
  const { hydrated, memory, pending, reducedMotion } =
    useConciergeConversation();

  return (
    <div id="experience" className={cn("msx-experience scroll-mt-28", className)}>
      <div className="msx-experience-shell">
        <div className="msx-experience-grid">
          <div className="msx-experience-main">
            <p className="msx-kicker">Chapters 02 · 03 · 04 · 06</p>
            <h2 className="msx-experience-title">Summer appears.</h2>
            <p className="msx-experience-lede">
              One question at a time. Real discovery. Recommendations with
              reasoning — never a support widget.
            </p>
            <SummerEmbeddedPanel className="msx-conversation mt-8 min-h-[36rem] md:min-h-[40rem]" />
          </div>

          <aside className="msx-experience-side">
            <div className="msx-side-block">
              <p className="msx-kicker">Chapter 04 · Visible intelligence</p>
              <ul className="msx-intel-list" aria-label="How Summer reasons">
                {MEET_SUMMER_VISIBLE_INTEL.map((label) => (
                  <li
                    key={label}
                    className={cn(
                      "msx-intel-item",
                      pending && !reducedMotion && "msx-intel-item-active",
                    )}
                  >
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="msx-side-block mt-6 flex-1">
              <p className="msx-kicker mb-3">Chapter 05 · Business understanding</p>
              {hydrated ? (
                <SummerUnderstandingPanel
                  memory={memory}
                  reducedMotion={reducedMotion}
                  className="msx-understand h-full min-h-[22rem]"
                />
              ) : (
                <div className="msx-understand flex min-h-[22rem] items-center justify-center">
                  <p className="text-sm text-white/45">Preparing understanding…</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
