"use client";

import { SummerEmbeddedPanel } from "@/components/website-concierge/summer-embedded-panel";
import { SummerUnderstandingPanel } from "@/components/website-concierge/summer-understanding-panel";
import { useConciergeConversation } from "@/components/website-concierge/use-concierge-conversation";
import { cn } from "@/lib/utils";

/**
 * Large centered AI workspace — conversation + live Business Understanding.
 * Presentation layer only; engines unchanged.
 */
export function SummerWorkspace({ className }: { className?: string }) {
  const { hydrated, memory, reducedMotion } = useConciergeConversation();

  return (
    <div
      id="try-summer"
      className={cn("meet-summer-workspace scroll-mt-24", className)}
    >
      <div className="meet-summer-workspace-grid">
        <SummerEmbeddedPanel className="min-h-[38rem] md:min-h-[42rem]" />
        {hydrated ? (
          <SummerUnderstandingPanel
            memory={memory}
            reducedMotion={reducedMotion}
            className="md:min-h-[42rem]"
          />
        ) : (
          <div
            className="meet-summer-understand flex min-h-[16rem] items-center justify-center md:min-h-[42rem]"
            aria-hidden
          >
            <p className="text-sm text-white/45">Preparing understanding…</p>
          </div>
        )}
      </div>
    </div>
  );
}
