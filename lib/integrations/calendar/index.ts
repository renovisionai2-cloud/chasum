import type { CalendarProvider } from "@/lib/types/integrations";
import { googleCalendarAdapter } from "@/lib/integrations/calendar/google";
import { outlookCalendarAdapter } from "@/lib/integrations/calendar/outlook";
import type { CalendarProviderAdapter } from "@/lib/integrations/providers/types";

export function getCalendarAdapter(
  provider: CalendarProvider,
): CalendarProviderAdapter | null {
  switch (provider) {
    case "google":
      return googleCalendarAdapter;
    case "outlook":
      return outlookCalendarAdapter;
    case "apple":
      return null;
    default:
      return null;
  }
}
