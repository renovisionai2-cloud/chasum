import {
  resolveRequestedStatus,
  validateBooking,
} from "@/lib/booking-engine/availability";
import {
  findRoomConflicts,
  mapRpcErrorToConflict,
} from "@/lib/booking-engine/conflicts";
import { logAppointmentChange } from "@/lib/booking-engine/conflicts";
import {
  createBookingEvent,
  emitBookingEvent,
} from "@/lib/booking-engine/events";
import {
  isPublicRpcPersistence,
  sessionBookingPersistence,
  type BookingPersistenceStrategy,
} from "@/lib/booking-engine/persistence";
import type {
  BookingIntent,
  MutationResult,
} from "@/lib/booking-engine/types";
import { createClient } from "@/lib/supabase/server";

type AppointmentWriterClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Privilege-neutral create. Persistence is explicit — never inferred from
 * intent.channel. Default writer is the session/RLS-protected insert.
 */
export async function createBooking(
  intent: BookingIntent,
  persistence: BookingPersistenceStrategy = sessionBookingPersistence(),
): Promise<MutationResult<{ appointmentId: string }>> {
  const pending: MutationResult<{ appointmentId: string }> = {
    phase: "pending",
  };

  if (isPublicRpcPersistence(persistence)) {
    if (!intent.staffId) {
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
    if (
      !persistence.customerName.trim() ||
      !persistence.customerEmail.includes("@")
    ) {
      return {
        phase: "rollback",
        error: "Customer is required to create a booking.",
      };
    }
  } else if (!intent.customerId) {
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

  if (isPublicRpcPersistence(persistence)) {
    if (status !== "pending" && status !== "confirmed") {
      return {
        phase: "rollback",
        error: "Public booking status must be pending or confirmed.",
      };
    }
  }

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

  // Authoritative tax + exclusive subtotal from catalog + tax rates.
  const { data: taxRows } = await supabase
    .from("tax_rates")
    .select("id, name, rate_bps, inclusive, is_default, is_active")
    .eq("business_id", intent.businessId)
    .eq("is_active", true);
  const { resolveBookingFinancials } = await import(
    "@/lib/commerce/booking-financials"
  );

  // When the form already stamped exclusive price + tax, keep that exclusive
  // convention. Never reinterpret (price + tax) as a tax-inclusive catalog.
  const formProvidedTax =
    intent.taxCents != null && Number.isFinite(intent.taxCents);
  const financials = formProvidedTax
    ? resolveBookingFinancials({
        catalogPriceCents: priceCents,
        taxInclusive: false,
        taxCents: Math.max(0, Math.round(intent.taxCents!)),
        depositRequiredCents:
          intent.depositCents ?? serviceRow?.deposit_cents ?? null,
        depositRequired: serviceRow?.deposit_required,
      })
    : resolveBookingFinancials({
        catalogPriceCents:
          intent.priceCents != null && intent.priceCents > 0
            ? Math.round(Number(serviceRow?.price ?? 0) * 100) || priceCents
            : Math.round(Number(serviceRow?.price ?? 0) * 100),
        serviceTaxRateBps: serviceRow?.tax_rate_bps ?? null,
        taxRates: (taxRows ?? []) as Parameters<
          typeof resolveBookingFinancials
        >[0]["taxRates"],
        depositRequiredCents:
          intent.depositCents ?? serviceRow?.deposit_cents ?? null,
        depositRequired: serviceRow?.deposit_required,
      });

  // Prefer form exclusive stamp when both price and tax were provided.
  const stampedPriceCents = formProvidedTax
    ? priceCents
    : financials.subtotalCents;
  const taxCents = formProvidedTax
    ? Math.max(0, Math.round(intent.taxCents!))
    : financials.taxCents;
  const depositCents =
    intent.depositCents != null && intent.depositCents > 0
      ? intent.depositCents
      : financials.depositRequiredCents;

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

  const persist = isPublicRpcPersistence(persistence)
    ? await persistViaPublicRpc(supabase, {
        intent,
        persistence,
        endTime: validation.endTime,
        status,
        notes,
        // Preview/compat payload only. After 041 the RPC ignores these and
        // stamps catalog financials from services + tax_rates.
        stampedPriceCents,
        taxCents,
        depositCents,
      })
    : await persistViaSessionInsert(supabase, {
        intent,
        endTime: validation.endTime,
        status,
        notes,
        stampedPriceCents,
        taxCents,
        depositCents,
        paymentStatus,
      });

  if (persist.error && persist.conflict) {
    return {
      phase: "conflict",
      conflicts: [persist.conflict],
      error: persist.conflict.message,
    };
  }

  // Nullable staff_id may not be available yet — never expose schema/migration wording.
  if (
    persist.error &&
    !intent.staffId &&
    (persist.error.message.includes("staff_id") ||
      persist.error.message.toLowerCase().includes("null value"))
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

  if (persist.error || !persist.id) {
    return {
      phase: "rollback",
      error: persist.error?.message ?? "Failed to create appointment.",
    };
  }

  const event = await emitBookingEvent(
    createBookingEvent({
      type: "appointment.created",
      businessId: intent.businessId,
      appointmentId: persist.id,
      channel: intent.channel,
      payload: { status, pendingWas: pending.phase },
    }),
  );

  if (
    !isPublicRpcPersistence(persistence) &&
    intent.resourceIds &&
    intent.resourceIds.length > 0
  ) {
    await supabase.from("appointment_resources").insert(
      intent.resourceIds.map((resourceId) => ({
        appointment_id: persist.id,
        resource_id: resourceId,
      })),
    );
  }

  await logAppointmentChange({
    businessId: intent.businessId,
    appointmentId: persist.id,
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
    data: { appointmentId: persist.id },
    events: [event],
  };
}

async function persistViaSessionInsert(
  supabase: AppointmentWriterClient,
  input: {
    intent: BookingIntent;
    endTime: string;
    status: string;
    notes: string | null;
    stampedPriceCents: number;
    taxCents: number;
    depositCents: number;
    paymentStatus: string;
  },
): Promise<{
  id: string | null;
  error: { message: string } | null;
  conflict?: never;
}> {
  const insertBase = {
    business_id: input.intent.businessId,
    location_id: input.intent.locationId,
    service_id: input.intent.serviceId,
    staff_id: input.intent.staffId || null,
    customer_id: input.intent.customerId!,
    start_time: input.intent.requestedStart,
    end_time: input.endTime,
    notes: input.notes,
    status: input.status,
    room_id: input.intent.roomId ?? null,
  };

  let { data, error } = await supabase
    .from("appointments")
    .insert({
      ...insertBase,
      price_cents: input.stampedPriceCents || null,
      tax_cents: input.taxCents,
      deposit_cents: input.depositCents || 0,
      amount_paid_cents: 0,
      payment_status: input.paymentStatus,
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
          : { tax_cents: input.taxCents }),
      })
      .select("id")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  return {
    id: data?.id ?? null,
    error: error ? { message: error.message } : null,
  };
}

async function persistViaPublicRpc(
  supabase: AppointmentWriterClient,
  input: {
    intent: BookingIntent;
    persistence: Extract<BookingPersistenceStrategy, { kind: "public_rpc" }>;
    endTime: string;
    status: "pending" | "confirmed";
    notes: string | null;
    stampedPriceCents: number;
    taxCents: number;
    depositCents: number;
  },
): Promise<{
  id: string | null;
  error: { message: string } | null;
  conflict?: ReturnType<typeof mapRpcErrorToConflict>;
}> {
  const { data, error } = await supabase.rpc("book_public_appointment", {
    p_business_id: input.intent.businessId,
    p_location_id: input.intent.locationId,
    p_service_id: input.intent.serviceId,
    p_staff_id: input.intent.staffId,
    p_customer_name: input.persistence.customerName,
    p_customer_email: input.persistence.customerEmail,
    p_customer_phone: input.persistence.customerPhone,
    p_start_time: input.intent.requestedStart,
    p_end_time: input.endTime,
    p_status: input.status,
    // Kept for 040 PostgREST compatibility while 041 is unapplied.
    // 041 ignores these and persists server-authoritative catalog amounts.
    p_price_cents: input.stampedPriceCents || 0,
    p_tax_cents: input.taxCents,
    p_deposit_cents: input.depositCents || 0,
    p_notes: input.notes,
  });

  if (error) {
    const conflict = mapRpcErrorToConflict(error.message);
    const slotOrBusy =
      conflict.code === "DOUBLE_BOOKING" ||
      conflict.code === "STAFF_BUSY" ||
      conflict.code === "VACATION" ||
      conflict.code === "LUNCH_BREAK" ||
      conflict.code === "SERVICE_BLACKOUT" ||
      conflict.code === "BUSINESS_CLOSURE" ||
      conflict.code === "OUTSIDE_EMPLOYEE_HOURS" ||
      conflict.code === "OUTSIDE_BUSINESS_HOURS" ||
      conflict.code === "MIN_NOTICE" ||
      conflict.code === "MAX_BOOKING_WINDOW" ||
      conflict.code === "MAX_APPOINTMENTS" ||
      conflict.code === "RESOURCE_BUSY";
    return {
      id: null,
      error: { message: error.message },
      conflict: slotOrBusy ? conflict : undefined,
    };
  }

  const id = typeof data === "string" ? data : null;
  return { id, error: id ? null : { message: "Failed to create appointment." } };
}
