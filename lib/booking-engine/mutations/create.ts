import {
  resolveRequestedStatus,
  validateBooking,
} from "@/lib/booking-engine/availability";
import { findRoomConflicts } from "@/lib/booking-engine/conflicts";
import { logAppointmentChange } from "@/lib/booking-engine/conflicts";
import {
  createBookingEvent,
  emitBookingEvent,
} from "@/lib/booking-engine/events";
import type {
  BookingIntent,
  MutationResult,
} from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

export async function createBooking(
  intent: BookingIntent,
): Promise<MutationResult<{ appointmentId: string }>> {
  const pending: MutationResult<{ appointmentId: string }> = {
    phase: "pending",
  };

  if (!intent.customerId) {
    return {
      phase: "rollback",
      error: "Customer is required to create a booking.",
    };
  }

  const validation = await validateBooking(intent);
  if (!validation.ok) {
    return {
      phase: "conflict",
      conflicts: validation.conflicts,
      error: validation.conflicts[0]?.message,
    };
  }

  if (intent.roomId) {
    const roomConflicts = await findRoomConflicts({
      businessId: intent.businessId,
      roomId: intent.roomId,
      startIso: intent.requestedStart,
      endIso: validation.endTime,
    });
    if (roomConflicts.length > 0) {
      return {
        phase: "conflict",
        conflicts: roomConflicts,
        error: roomConflicts[0]?.message,
      };
    }
  }

  const status = resolveRequestedStatus(
    validation.context,
    intent.requestedStatus,
  );

  const supabase = await createClient();

  // Stamp commercial fields so deposits / balances / invoices stay in sync.
  const { data: serviceRow } = await supabase
    .from("services")
    .select("price, deposit_cents, deposit_required, tax_rate_bps")
    .eq("id", intent.serviceId)
    .eq("business_id", intent.businessId)
    .maybeSingle();

  const priceCents =
    intent.priceCents != null && intent.priceCents > 0
      ? intent.priceCents
      : Math.round(Number(serviceRow?.price ?? 0) * 100);
  const depositCents =
    intent.depositCents != null
      ? intent.depositCents
      : Number(serviceRow?.deposit_cents ?? 0) ||
        (serviceRow?.deposit_required ? Math.round(priceCents * 0.2) : 0);

  let taxCents =
    intent.taxCents != null && Number.isFinite(intent.taxCents)
      ? Math.max(0, Math.round(intent.taxCents))
      : null;

  if (taxCents == null) {
    const { data: taxRows } = await supabase
      .from("tax_rates")
      .select("id, name, rate_bps, inclusive, is_default, is_active")
      .eq("business_id", intent.businessId)
      .eq("is_active", true);
    const { resolveBookingFinancials } = await import(
      "@/lib/commerce/booking-financials"
    );
    const financials = resolveBookingFinancials({
      subtotalCents: priceCents,
      serviceTaxRateBps: serviceRow?.tax_rate_bps ?? null,
      taxRates: (taxRows ?? []) as Parameters<
        typeof resolveBookingFinancials
      >[0]["taxRates"],
      depositRequiredCents: depositCents,
      depositRequired: serviceRow?.deposit_required,
    });
    taxCents = financials.taxCents;
  }

  const paymentStatus =
    depositCents > 0 ? "deposit_required" : "unpaid";

  const notes =
    intent.packageId && intent.packageName
      ? [
          intent.notes?.trim() || null,
          `Package: ${intent.packageName} (${intent.packageId})`,
        ]
          .filter(Boolean)
          .join("\n")
      : (intent.notes ?? null);

  const insertBase = {
    business_id: intent.businessId,
    location_id: intent.locationId,
    service_id: intent.serviceId,
    staff_id: intent.staffId || null,
    customer_id: intent.customerId!,
    start_time: intent.requestedStart,
    end_time: validation.endTime,
    notes,
    status,
    room_id: intent.roomId ?? null,
  };

  let { data, error } = await supabase
    .from("appointments")
    .insert({
      ...insertBase,
      price_cents: priceCents || null,
      tax_cents: taxCents,
      deposit_cents: depositCents || 0,
      amount_paid_cents: 0,
      payment_status: paymentStatus,
    })
    .select("id")
    .single();

  if (
    error &&
    (error.message.includes("price_cents") ||
      error.message.includes("payment_status") ||
      error.message.includes("amount_paid") ||
      error.message.includes("deposit_cents") ||
      error.message.includes("tax_cents"))
  ) {
    const fallback = await supabase
      .from("appointments")
      .insert({
        ...insertBase,
        ...(error.message.includes("tax_cents")
          ? {}
          : { tax_cents: taxCents }),
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  // Nullable staff_id may not be available yet — never expose schema/migration wording.
  if (
    error &&
    !intent.staffId &&
    (error.message.includes("staff_id") ||
      error.message.toLowerCase().includes("null value"))
  ) {
    const { unassignedStaffBlockedMessage } = await import(
      "@/lib/booking/optional-staff"
    );
    return {
      phase: "rollback",
      error:
        unassignedStaffBlockedMessage(intent.channel) ??
        "Please select an employee to complete this booking.",
    };
  }

  if (error || !data?.id) {
    return {
      phase: "rollback",
      error: error?.message ?? "Failed to create appointment.",
    };
  }

  const event = await emitBookingEvent(
    createBookingEvent({
      type: "appointment.created",
      businessId: intent.businessId,
      appointmentId: data.id,
      channel: intent.channel,
      payload: { status, pendingWas: pending.phase },
    }),
  );

  if (intent.resourceIds && intent.resourceIds.length > 0) {
    await supabase.from("appointment_resources").insert(
      intent.resourceIds.map((resourceId) => ({
        appointment_id: data.id,
        resource_id: resourceId,
      })),
    );
  }

  await logAppointmentChange({
    businessId: intent.businessId,
    appointmentId: data.id,
    action: "create",
    afterState: {
      start_time: intent.requestedStart,
      end_time: validation.endTime,
      status,
      channel: intent.channel,
    },
  });

  return {
    phase: "success",
    data: { appointmentId: data.id },
    events: [event],
  };
}
