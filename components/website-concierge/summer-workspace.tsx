"use client";

import { SummerEmbeddedPanel } from "@/components/website-concierge/summer-embedded-panel";
import { SummerUnderstandingPanel } from "@/components/website-concierge/summer-understanding-panel";
import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { cn } from "@/lib/utils";

/**
 * Flagship intelligence console — conversation + live Business Understanding.
 * Presentation only; Knowledge / Discovery / Session Memory unchanged.
 */
export function SummerWorkspace({ className }: { className?: string }) {
  const { hydrated, memory, pending, reducedMotion } =
    useConciergeConversation();

  const status = !hydrated
    ? "Initializing"
    : pending
      ? "Reasoning"
      : memory.businessType !== "unknown"
        ? "Understanding active"
        : "Listening";

  return (
    <div
      id="try-summer"
      className={cn("meet-summer-workspace scroll-mt-24", className)}
    >
      <div className="meet-summer-console">
        <div className="meet-summer-console-bar">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              Intelligence layer
            </span>
            <span className="hidden text-white/20 sm:inline" aria-hidden>
              ·
            </span>
            <span className="text-xs text-white/55">
              Summer · AI Business Assistant
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 rounded-full bg-emerald-400",
                !reducedMotion && pending && "marketing-live-dot",
              )}
              aria-hidden
            />
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
              {status}
            </span>
          </div>
        </div>

        <div className="meet-summer-workspace-grid">
          <SummerEmbeddedPanel className="min-h-[38rem] rounded-none border-0 shadow-none md:min-h-[44rem]" />
          {hydrated ? (
            <SummerUnderstandingPanel
              memory={memory}
              reducedMotion={reducedMotion}
              className="rounded-none border-0 border-t border-white/10 shadow-none md:min-h-[44rem] md:border-l md:border-t-0"
            />
          ) : (
            <div
              className="meet-summer-understand flex min-h-[14rem] items-center justify-center rounded-none border-0 border-t border-white/10 md:min-h-[44rem] md:border-l md:border-t-0"
              aria-hidden
            >
              <p className="text-sm text-white/45">Preparing understanding…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
