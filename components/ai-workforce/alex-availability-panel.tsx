import { formatTime, parseISO } from "@/lib/calendar/utils";
import {
  getAlexAvailabilityRecommendations,
  type AlexSlotRecommendation,
} from "@/lib/ai-workforce/alex";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

function SlotGroup({ rec }: { rec: AlexSlotRecommendation }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border/80 bg-muted/30 px-3 py-2.5">
      <p className="text-sm font-medium">
        {rec.date} · {rec.serviceName}
      </p>
      <p className="text-xs text-muted-foreground">{rec.staffName}</p>
      <p className="mt-1.5 text-xs tabular-nums text-foreground">
        {rec.slots.map((iso) => formatTime(parseISO(iso))).join(" · ")}
      </p>
    </div>
  );
}

/** Server panel: Alex recommendations from get_available_slots only. */
export async function AlexAvailabilityPanel() {
  const result = await getAlexAvailabilityRecommendations({ daysAhead: 5 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live availability</CardTitle>
        <CardDescription>
          From the scheduling engine — Alex never invents times
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{result.message}</p>
        {result.recommendations.length > 0 ? (
          <div className="space-y-2">
            {result.recommendations.map((rec) => (
              <SlotGroup
                key={`${rec.date}-${rec.staffId}-${rec.serviceId}`}
                rec={rec}
              />
            ))}
          </div>
        ) : null}
        <Link href="/dashboard/calendar">
          <Button size="sm" variant="outline" className="mt-1">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            Open calendar
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
