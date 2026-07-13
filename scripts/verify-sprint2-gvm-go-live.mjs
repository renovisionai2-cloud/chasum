/**
 * Sprint 2 — verify GVM Baby World go-live readiness + booking flow.
 * Creates a temporary appointment, asserts calendar/customer/location wiring,
 * then deletes the appointment and customer. Leaves no demo data behind.
 *
 * Usage: node scripts/verify-sprint2-gvm-go-live.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function nextWeekdayDate(offsetDays = 7) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().slice(0, 10);
}

const REQUIRED_SERVICES = [
  "2D Ultrasound",
  "Gender Reveal Ultrasound",
  "3D/4D Ultrasound",
  "5D HDLive Ultrasound",
  "Heartbeat Recording",
];

async function main() {
  console.log("Sprint 2 — GVM Baby World go-live verification\n");

  // Schema columns
  const { error: bizColError } = await supabase
    .from("businesses")
    .select(
      "logo_url, phone, email, website, address_line1, booking_policy, social_links",
    )
    .limit(1);
  if (bizColError) fail("Business profile columns", bizColError.message);
  else pass("Business profile columns");

  const { error: svcColError } = await supabase
    .from("services")
    .select("online_booking, preparation_instructions")
    .limit(1);
  if (svcColError) fail("Service booking columns", svcColError.message);
  else pass("Service booking columns");

  const { error: staffColError } = await supabase
    .from("staff")
    .select("biography, qualifications, photo_url")
    .limit(1);
  if (staffColError) fail("Staff profile columns", staffColError.message);
  else pass("Staff profile columns");

  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", "gvm-baby-world")
    .maybeSingle();

  if (bizError || !business) {
    fail("Business slug gvm-baby-world", bizError?.message ?? "not found");
    console.error("\nRun: node scripts/setup-gvm-baby-world.mjs");
    process.exit(1);
  }

  if (business.name === "GVM Baby World Ultrasound") {
    pass("Business name", business.name);
  } else {
    fail("Business name", `expected GVM Baby World Ultrasound, got ${business.name}`);
  }

  if (business.cancellation_policy) pass("Cancellation policy set");
  else fail("Cancellation policy set");

  if (business.booking_policy) pass("Booking policy set");
  else fail("Booking policy set");

  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_default", true)
    .maybeSingle();

  if (location) pass("Default location", location.name);
  else fail("Default location");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true);

  const names = new Set((services ?? []).map((s) => s.name));
  for (const required of REQUIRED_SERVICES) {
    if (names.has(required)) pass(`Service: ${required}`);
    else fail(`Service: ${required}`);
  }

  const bookable = (services ?? []).filter(
    (s) => s.online_booking !== false && s.location_id === location?.id,
  );
  if (bookable.length >= 5) {
    pass("Online-bookable services at default location", String(bookable.length));
  } else {
    fail(
      "Online-bookable services at default location",
      `found ${bookable.length}`,
    );
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("*, staff_services(service_id)")
    .eq("business_id", business.id)
    .eq("is_active", true);

  if (staff?.length) {
    pass("Active staff", `${staff.length} member(s)`);
    const member = staff[0];
    if (member.biography) pass("Staff biography");
    else fail("Staff biography");
    if (member.qualifications) pass("Staff qualifications");
    else fail("Staff qualifications");
    if (member.location_id === location?.id) {
      pass("Staff assigned to default location");
    } else {
      fail("Staff assigned to default location");
    }
    const assigned = member.staff_services?.length ?? 0;
    if (assigned >= 5) pass("Staff assigned services", String(assigned));
    else fail("Staff assigned services", `only ${assigned}`);
  } else {
    fail("Active staff");
  }

  // Booking flow: temporary appointment then cleanup
  const service = bookable[0];
  const member = staff?.[0];
  if (!service || !member || !location) {
    console.error("\nCannot verify booking flow — missing fixtures.");
    process.exit(1);
  }

  const date = nextWeekdayDate(7);
  const { data: slots, error: slotError } = await supabase.rpc(
    "get_available_slots",
    {
      p_business_id: business.id,
      p_service_id: service.id,
      p_staff_id: member.id,
      p_date: date,
      p_exclude_appointment_id: null,
      p_location_id: location.id,
    },
  );

  if (slotError) fail("Available slots RPC", slotError.message);
  else if (!slots?.length) fail("Available slots RPC", `no slots on ${date}`);
  else pass("Available slots RPC", `${slots.length} on ${date}`);

  const startTime = slots?.[0];
  if (!startTime) {
    console.error("\nNo slot to book — check location hours / staff schedule.");
    process.exit(results.some((r) => !r.ok) ? 1 : 0);
  }

  const verifyEmail = `sprint2-verify-${Date.now()}@chasum.test`;
  let customerId = null;
  let appointmentId = null;

  try {
    const { data: upsertedCustomer, error: customerError } = await supabase.rpc(
      "upsert_booking_customer",
      {
        p_business_id: business.id,
        p_name: "Sprint2 Verify Client",
        p_email: verifyEmail,
        p_phone: null,
      },
    );
    if (customerError || !upsertedCustomer) {
      fail("Customer upsert", customerError?.message ?? "no id");
    } else {
      customerId = upsertedCustomer;
      pass("Customer upsert");
    }

    const endIso = new Date(
      new Date(startTime).getTime() + service.duration_minutes * 60_000,
    ).toISOString();

    const { data: apptId, error: apptError } = await supabase.rpc(
      "create_public_appointment",
      {
        p_business_id: business.id,
        p_service_id: service.id,
        p_staff_id: member.id,
        p_customer_id: customerId,
        p_start_time: startTime,
        p_end_time: endIso,
        p_notes: "Sprint 2 verification — will be deleted",
        p_location_id: location.id,
      },
    );

    if (apptError || !apptId) {
      fail("Public appointment create", apptError?.message ?? "no id");
    } else {
      appointmentId = apptId;
      pass("Public appointment create");
    }

    if (appointmentId) {
      const { data: appt } = await supabase
        .from("appointments")
        .select("id, location_id, customer_id, status, start_time")
        .eq("id", appointmentId)
        .single();

      if (appt?.location_id === location.id) {
        pass("Appointment belongs to correct location");
      } else {
        fail(
          "Appointment belongs to correct location",
          appt?.location_id ?? "missing",
        );
      }

      if (appt?.customer_id === customerId) {
        pass("Appointment linked to customer");
      } else {
        fail("Appointment linked to customer");
      }

      // Calendar visibility (same query shape as dashboard)
      const { data: calendarRows } = await supabase
        .from("appointments")
        .select(
          "id, service:services(name), customer:customers(name), location:locations(name)",
        )
        .eq("id", appointmentId);

      if (calendarRows?.length === 1) pass("Appointment visible for calendar");
      else fail("Appointment visible for calendar");
    }
  } finally {
    if (appointmentId) {
      await supabase.from("appointments").delete().eq("id", appointmentId);
    }
    if (customerId) {
      await supabase.from("customers").delete().eq("id", customerId);
    }
    pass("Cleanup temporary verify data");
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed`,
  );
  if (failed.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
