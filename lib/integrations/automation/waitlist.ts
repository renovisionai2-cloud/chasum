import { createServiceClient } from "@/lib/supabase/service";
import { enqueueEmailJob, enqueueJob } from "@/lib/integrations/jobs/queue";
import { newSendIntentId, waitlistChildIntentId } from "@/lib/communications/intent-identity";
import { unwrapRelation } from "@/lib/supabase/relations";

export async function notifyWaitlistForSlot(
  businessId: string,
  cancelledAppointmentId: string,
  parentJobId?: string,
) {
  const supabase = createServiceClient();
  // Worker retries preserve parentJobId. A direct invocation is a new occurrence.
  const occurrenceId = parentJobId ?? newSendIntentId();

  const { data: cancelled, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, business_id, service_id, staff_id, start_time")
    .eq("id", cancelledAppointmentId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (appointmentError) throw new Error("waitlist_appointment_read_failed");
  if (!cancelled) return;
  if (cancelled.business_id !== businessId) throw new Error("waitlist_appointment_tenant_mismatch");

  const date = cancelled.start_time.split("T")[0];

  const { data: entries, error: entriesError } = await supabase
    .from("waitlists")
    .select("*, customer:customers(id, business_id, name, email)")
    .eq("business_id", businessId)
    .eq("service_id", cancelled.service_id)
    .eq("preferred_date", date)
    .eq("status", "waiting")
    .limit(5);
  if (entriesError) throw new Error("waitlist_entries_read_failed");

  for (const entry of entries ?? []) {
    const customer = unwrapRelation(entry.customer) as {
      id: string; business_id: string; name: string; email: string | null;
    } | null;
    if (entry.business_id !== businessId || !customer || customer.business_id !== businessId ||
        customer.id !== entry.customer_id || !customer.email) {
      throw new Error("waitlist_customer_tenant_or_recipient_unverified");
    }

    await enqueueEmailJob(businessId, {
      appointmentId: cancelledAppointmentId,
      templateKey: "appointment.business",
      recipient: customer.email,
      action: `A slot opened up for ${date}! Book now.`,
      sendIntentId: waitlistChildIntentId(occurrenceId, entry.id),
      parentJobId: occurrenceId,
      waitlistEntryId: entry.id,
    });

    const { data: updated, error: updateError } = await supabase
      .from("waitlists")
      .update({ status: "notified" })
      .eq("id", entry.id)
      .eq("business_id", businessId)
      .eq("status", "waiting")
      .select("id");
    if (updateError || updated?.length !== 1) throw new Error("waitlist_status_write_unconfirmed");

    const { error: notificationError } = await supabase.from("notifications").insert({
      business_id: businessId,
      type: "waitlist",
      channel: "in_app",
      title: "Waitlist slot available",
      body: `${customer.name} was notified about an open slot on ${date}.`,
      metadata: { waitlistId: entry.id, appointmentId: cancelledAppointmentId },
    });
    if (notificationError) throw new Error("waitlist_notification_write_failed");
  }
}

export async function enqueueWaitlistNotification(
  businessId: string,
  appointmentId: string,
) {
  await enqueueJob("waitlist_notify", { appointmentId }, { businessId });
}
