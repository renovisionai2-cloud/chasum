"use client";

import { BookingSection } from "@/components/booking/booking-section";
import { Button } from "@/components/ui/button";

type SummerAssistantProps = {
  disabled?: boolean;
  onSuggestAfternoon: () => void;
  onSuggestOtherEmployee: () => void;
  onMoveTomorrowMorning: () => void;
};

/**
 * Summer booking assistance — secondary to the main booking journey.
 * Suggestions only nudge the sheet; times still come from real availability.
 */
export function SummerAssistant({
  disabled,
  onSuggestAfternoon,
  onSuggestOtherEmployee,
  onMoveTomorrowMorning,
}: SummerAssistantProps) {
  return (
    <BookingSection
      title="Summer suggestions"
      description="Helpful shortcuts when you need another option."
      collapsible
      defaultOpen={false}
    >
      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={onSuggestAfternoon}
        >
          Find another this afternoon
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={onSuggestOtherEmployee}
        >
          Suggest another employee
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs"
          disabled={disabled}
          onClick={onMoveTomorrowMorning}
        >
          Move to tomorrow morning
        </Button>
      </div>
    </BookingSection>
  );
}
