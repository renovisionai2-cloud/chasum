"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

type SummerAssistantProps = {
  disabled?: boolean;
  onSuggestAfternoon: () => void;
  onSuggestOtherEmployee: () => void;
  onMoveTomorrowMorning: () => void;
};

/**
 * Summer appears as an assistant. Suggestions only nudge the sheet —
 * availability still comes from the Booking Engine.
 */
export function SummerAssistant({
  disabled,
  onSuggestAfternoon,
  onSuggestOtherEmployee,
  onMoveTomorrowMorning,
}: SummerAssistantProps) {
  return (
    <section
      className="rounded-[var(--radius-md)] border border-spark/25 bg-spark/5 px-3 py-3"
      aria-label="Summer assistant"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-spark/15 text-spark">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold">Summer</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Suggestions only — Summer never invents slots or bypasses the Booking
            Engine.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={disabled}
              onClick={onSuggestAfternoon}
            >
              Find another this afternoon
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={disabled}
              onClick={onSuggestOtherEmployee}
            >
              Suggest another employee
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={disabled}
              onClick={onMoveTomorrowMorning}
            >
              Move to tomorrow morning
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
