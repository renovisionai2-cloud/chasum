import { getCommunicationService } from "@/lib/communication/service";
import type {
  CrmAppointmentBucket,
  CrmCustomerNote,
  CrmInsights,
  CrmPaymentEvent,
  CrmProfile,
  CrmTimelineItem,
} from "@/lib/crm/types";
import { preferredFromHistory } from "@/lib/reception/preferences";
import { createClient } from "@/lib/supabase/server";
import { displayCustomerName } from "@/lib/crm/display";

export { displayCustomerName };

function mapNote(row: Record<string, unknown>): CrmCustomerNote {
  const rawType = String(row.note_type ?? "general");
  const noteType =
    rawType === "warning" ||
    rawType === "medical" ||
    rawType === "service" ||
    rawType === "general"
      ? rawType
      : "general";
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    body: String(row.body),
    noteType,
    isPinned: Boolean(row.is_pinned),
    isPrivate: Boolean(row.is_private),
    createdBy: (row.created_by as string) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapPayment(row: Record<string, unknown>): CrmPaymentEvent {
  return {
    id: String(row.id),
    businessId: String(row.business_id),
    customerId: String(row.customer_id),
    appointmentId: (row.appointment_id as string) ?? null,
    amountCents: Number(row.amount_cents ?? 0),
    currency: String(row.currency ?? "usd"),
    status: String(row.status ?? "recorded"),
    method: (row.method as string) ?? null,
    description: (row.description as string) ?? null,
    provider: (row.provider as string) ?? null,
    occurredAt: String(row.occurred_at ?? row.created_at),
    createdAt: String(row.created_at),
  };
}

function buildInsights(
  appointments: CrmAppointmentBucket[],
): CrmInsights {
  const now = Date.now();
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");
  const noShows = appointments.filter((a) => a.status === "no_show");
  const upcoming = appointments
    .filter(
      (a) =>
        a.status !== "cancelled" &&
        new Date(a.start_time).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  const history = appointments
    .filter(
      (a) =>
        a.status !== "cancelled" &&
        new Date(a.start_time).getTime() < now,
    )
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

  const lifetimeRevenue = completed.reduce((sum, a) => {
    const price = (a.service as { price?: number } | null)?.price ?? 0;
    return sum + Number(price);
  }, 0);

  const decided = completed.length + cancelled.length + noShows.length;
  const prefs = preferredFromHistory(appointments);

  return {
    lifetimeRevenue,
    totalAppointments: appointments.length,
    completedAppointments: completed.length,
    averageSpend:
      completed.length > 0
        ? Math.round((lifetimeRevenue / completed.length) * 100) / 100
        : 0,
    noShowRate:
      decided > 0 ? Math.round((noShows.length / decided) * 1000) / 10 : 0,
    cancellationRate:
      decided > 0 ? Math.round((cancelled.length / decided) * 1000) / 10 : 0,
    preferredEmployeeName: prefs.preferredStaffName,
    preferredServiceName: prefs.preferredServiceName,
    preferredLocationName: prefs.preferredLocationName,
    lastVisit: history[0]?.start_time ?? null,
    nextAppointment: upcoming[0]?.start_time ?? null,
    upcomingCount: upcoming.length,
    cancellationCount: cancelled.length,
    noShowCount: noShows.length,
  };
}

function buildTimeline(input: {
  appointments: CrmAppointmentBucket[];
  communications: Awaited<
    ReturnType<ReturnType<typeof getCommunicationService>["listForCustomer"]>
  >;
  documents: Array<{ id: string; name: string; created_at: string; category?: string }>;
  notes: CrmCustomerNote[];
  payments: CrmPaymentEvent[];
}): CrmTimelineItem[] {
  const items: CrmTimelineItem[] = [];

  for (const appt of input.appointments) {
    const serviceName = appt.service?.name ?? "Appointment";
    if (appt.status === "cancelled") {
      items.push({
        id: `appt-cancel-${appt.id}`,
        type: "cancellation",
        title: `Cancelled · ${serviceName}`,
        status: appt.status,
        occurredAt: appt.start_time,
        meta: { appointmentId: appt.id },
      });
    } else if (appt.status === "no_show") {
      items.push({
        id: `appt-noshow-${appt.id}`,
        type: "no_show",
        title: `No-show · ${serviceName}`,
        status: appt.status,
        occurredAt: appt.start_time,
        meta: { appointmentId: appt.id },
      });
    } else {
      items.push({
        id: `appt-${appt.id}`,
        type: "appointment",
        title: `${appt.status === "completed" ? "Completed" : "Appointment"} · ${serviceName}`,
        body: appt.staff?.name ? `With ${appt.staff.name}` : null,
        status: appt.status,
        occurredAt: appt.start_time,
        meta: { appointmentId: appt.id, recurring: Boolean(appt.recurring_rule_id) },
      });
    }
  }

  for (const row of input.communications.history) {
    const type =
      row.channel === "call"
        ? "call"
        : row.channel === "sms"
          ? "sms"
          : row.channel === "email"
            ? "email"
            : row.channel === "note"
              ? "note"
              : row.channel === "reminder"
                ? "reminder"
                : "other";
    items.push({
      id: `comm-${row.id}`,
      type,
      title:
        row.subject ||
        `${row.channel.charAt(0).toUpperCase()}${row.channel.slice(1)}`,
      body: row.body,
      status: row.status,
      occurredAt: row.createdAt,
    });
  }

  for (const doc of input.documents) {
    items.push({
      id: `doc-${doc.id}`,
      type: "document",
      title: `Document · ${doc.name}`,
      body: doc.category ?? null,
      occurredAt: doc.created_at,
    });
  }

  for (const note of input.notes) {
    const typeLabel =
      note.noteType === "warning"
        ? "Warning"
        : note.noteType === "medical"
          ? "Medical note"
          : note.noteType === "service"
            ? "Service note"
            : note.isPinned
              ? "Pinned note"
              : note.isPrivate
                ? "Private note"
                : "Note";
    items.push({
      id: `note-${note.id}`,
      type: "note",
      title: typeLabel,
      body: note.body,
      occurredAt: note.createdAt,
      meta: { noteType: note.noteType, pinned: note.isPinned, private: note.isPrivate },
    });
  }

  for (const payment of input.payments) {
    items.push({
      id: `pay-${payment.id}`,
      type: "payment",
      title: `Payment · $${(payment.amountCents / 100).toFixed(2)}`,
      body: payment.description,
      status: payment.status,
      occurredAt: payment.occurredAt,
    });
  }

  return items.sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export async function loadCrmProfile(
  businessId: string,
  customerId: string,
): Promise<CrmProfile | null> {
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !customer) return null;

  const { data: appointmentRows } = await supabase
    .from("appointments")
    .select(
      `id, start_time, end_time, status, staff_id, location_id, service_id, recurring_rule_id,
       service:services(name, price), staff:staff(name), location:locations(name, address_line1, address_line2, city, state, postal_code)`,
    )
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .order("start_time", { ascending: false });

  const appointments = (appointmentRows ?? []) as unknown as CrmAppointmentBucket[];
  const now = Date.now();

  const upcoming = appointments.filter(
    (a) =>
      a.status !== "cancelled" &&
      new Date(a.start_time).getTime() >= now,
  );
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");
  const noShows = appointments.filter((a) => a.status === "no_show");
  const recurring = appointments.filter((a) => Boolean(a.recurring_rule_id));

  const { data: documents } = await supabase
    .from("customer_documents")
    .select("*")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  let notes: CrmCustomerNote[] = [];
  const { data: noteRows, error: noteError } = await supabase
    .from("customer_notes")
    .select("*")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (!noteError && noteRows) {
    notes = noteRows.map((row) => mapNote(row as Record<string, unknown>));
  }

  let payments: CrmPaymentEvent[] = [];
  const { data: paymentRows, error: payError } = await supabase
    .from("customer_payment_events")
    .select("*")
    .eq("customer_id", customerId)
    .eq("business_id", businessId)
    .order("occurred_at", { ascending: false });

  if (!payError && paymentRows) {
    payments = paymentRows.map((row) =>
      mapPayment(row as Record<string, unknown>),
    );
  }

  const communications = await getCommunicationService().listForCustomer(
    businessId,
    customerId,
  );

  let assignedStaff: { id: string; name: string } | null = null;
  if (customer.assigned_staff_id) {
    const { data: staff } = await supabase
      .from("staff")
      .select("id, name")
      .eq("id", customer.assigned_staff_id)
      .maybeSingle();
    if (staff) assignedStaff = staff as { id: string; name: string };
  }

  let preferredLocation: { id: string; name: string } | null = null;
  if (customer.preferred_location_id) {
    const { data: location } = await supabase
      .from("locations")
      .select("id, name")
      .eq("id", customer.preferred_location_id)
      .maybeSingle();
    if (location) preferredLocation = location as { id: string; name: string };
  }

  let membership: { id: string; name: string } | null = null;
  if (customer.membership_id) {
    const { data: plan } = await supabase
      .from("memberships")
      .select("id, name")
      .eq("id", customer.membership_id)
      .maybeSingle();
    if (plan) membership = plan as { id: string; name: string };
  }

  const insights = buildInsights(appointments);
  const timeline = buildTimeline({
    appointments,
    communications,
    documents: documents ?? [],
    notes,
    payments,
  });

  return {
    customer: customer as CrmProfile["customer"],
    assignedStaff,
    preferredLocation,
    membership,
    documents: documents ?? [],
    notes,
    payments,
    communications,
    appointments: {
      all: appointments,
      upcoming,
      completed,
      cancelled,
      noShows,
      recurring,
    },
    timeline,
    insights,
  };
}

export async function touchCustomerActivity(
  businessId: string,
  customerId: string,
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("customers")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", customerId)
    .eq("business_id", businessId);
}
