import { addDays, addWeeks, addMonths, parseISO } from "date-fns";
import { createServiceClient } from "@/lib/supabase/service";
import { handleAppointmentEvent } from "@/lib/integrations/notifications/orchestrator";
import type { RecurrenceFrequency } from "@/lib/types/integrations";

function nextOccurrenceDate(
  current: Date,
  frequency: RecurrenceFrequency,
  interval: number,
): Date {
  switch (frequency) {
    case "daily":
      return addDays(current, interval);
    case "weekly":
      return addWeeks(current, interval);
    case "biweekly":
      return addWeeks(current, 2 * interval);
    case "monthly":
      return addMonths(current, interval);
  }
}

export async function generateRecurringOccurrences(ruleId: string) {
  const supabase = createServiceClient();

  const { data: rule } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("id", ruleId)
    .eq("active", true)
    .single();

  if (!rule) return;

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", rule.service_id)
    .single();

  if (!service) return;

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("recurring_rule_id", ruleId);

  if (rule.max_occurrences && (count ?? 0) >= rule.max_occurrences) return;

  let currentDate = parseISO(rule.start_date);
  const now = new Date();

  while (currentDate <= now) {
    currentDate = nextOccurrenceDate(
      currentDate,
      rule.frequency as RecurrenceFrequency,
      rule.interval_count,
    );
  }

  if (rule.end_date && currentDate > parseISO(rule.end_date)) return;

  const [hours, minutes] = rule.start_time.split(":").map(Number);
  const startTime = new Date(currentDate);
  startTime.setHours(hours, minutes, 0, 0);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + service.duration_minutes);

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      business_id: rule.business_id,
      service_id: rule.service_id,
      staff_id: rule.staff_id,
      customer_id: rule.customer_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
      notes: rule.notes,
      recurring_rule_id: ruleId,
    })
    .select("id")
    .single();

  if (error || !appointment) return;

  await handleAppointmentEvent(appointment.id, "created");
}

export async function scheduleRecurringJob(ruleId: string, businessId: string) {
  const { enqueueJob } = await import("@/lib/integrations/jobs/queue");
  await enqueueJob("recurring", { ruleId }, { businessId });
}
