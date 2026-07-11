import { createServiceClient } from "@/lib/supabase/service";
import { enqueueEmailJob, enqueueJob } from "@/lib/integrations/jobs/queue";

export async function notifyWaitlistForSlot(
  businessId: string,
  cancelledAppointmentId: string,
) {
  const supabase = createServiceClient();

  const { data: cancelled } = await supabase
    .from("appointments")
    .select("service_id, staff_id, start_time")
    .eq("id", cancelledAppointmentId)
    .single();

  if (!cancelled) return;

  const date = cancelled.start_time.split("T")[0];

  const { data: entries } = await supabase
    .from("waitlists")
    .select("*, customer:customers(name, email)")
    .eq("business_id", businessId)
    .eq("service_id", cancelled.service_id)
    .eq("preferred_date", date)
    .eq("status", "waiting")
    .limit(5);

  for (const entry of entries ?? []) {
    const customer = entry.customer as { name: string; email: string };

    await enqueueEmailJob(businessId, {
      appointmentId: cancelledAppointmentId,
      templateKey: "appointment.business",
      recipient: customer.email,
      action: `A slot opened up for ${date}! Book now.`,
    });

    await supabase
      .from("waitlists")
      .update({ status: "notified" })
      .eq("id", entry.id);

    await supabase.from("notifications").insert({
      business_id: businessId,
      type: "waitlist",
      channel: "in_app",
      title: "Waitlist slot available",
      body: `${customer.name} was notified about an open slot on ${date}.`,
      metadata: { waitlistId: entry.id, appointmentId: cancelledAppointmentId },
    });
  }
}

export async function enqueueWaitlistNotification(
  businessId: string,
  appointmentId: string,
) {
  await enqueueJob("waitlist_notify", { appointmentId }, { businessId });
}
