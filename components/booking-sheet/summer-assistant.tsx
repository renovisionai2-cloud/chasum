"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";

type SummerAssistantProps = {
  disabled?: boolean;
  onSuggestAfternoon: () => void;
  onSuggestOtherEmployee: () => void;
  onMoveTomorrowMorning: () => void;
};

/**
 * Summer booking assistance — secondary to the main booking journey.
 * Collapsed by default; opens only when asked.
 */
export function SummerAssistant({
  disabled,
  onSuggestAfternoon,
  onSuggestOtherEmployee,
  onMoveTomorrowMorning,
}: SummerAssistantProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="min-h-11 gap-1.5 text-xs text-muted-foreground"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-3.5" aria-hidden />
        Ask Summer
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-dashed border-border px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-tight">Ask Summer</p>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          onClick={() => setOpen(false)}
        >
          Hide
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Grounded shortcuts only — times still come from real availability.
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11 text-xs"
          disabled={disabled}
          onClick={onSuggestAfternoon}
        >
          Find another this afternoon
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11 text-xs"
          disabled={disabled}
          onClick={onSuggestOtherEmployee}
        >
          Suggest another employee
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-11 text-xs"
          disabled={disabled}
          onClick={onMoveTomorrowMorning}
        >
          Move to tomorrow morning
        </Button>
      </div>
    </div>
  );
}
