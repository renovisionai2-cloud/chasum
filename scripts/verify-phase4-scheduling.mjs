/**
 * Phase 4 scheduling engine verification.
 * Usage: node scripts/verify-phase4-scheduling.mjs
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

async function rpc(name, args) {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(`${name}: ${error.message}`);
  return data;
}

async function main() {
  let createdBusinessForTest = false;
  console.log("Phase 4 scheduling verification\n");

  // 0. RPC availability
  try {
    await supabase.rpc("get_available_slots", {
      p_business_id: "00000000-0000-0000-0000-000000000000",
      p_service_id: "00000000-0000-0000-0000-000000000000",
      p_staff_id: "00000000-0000-0000-0000-000000000000",
      p_date: nextWeekdayDate(),
      p_exclude_appointment_id: null,
    });
    pass("RPC get_available_slots exists");
  } catch (e) {
    fail("RPC get_available_slots exists", e.message);
    console.error("\nRun supabase/migrations/005_phase4_scheduling_engine.sql first.");
    process.exit(1);
  }

  try {
    await supabase.rpc("validate_appointment_slot", {
      p_business_id: "00000000-0000-0000-0000-000000000000",
      p_service_id: "00000000-0000-0000-0000-000000000000",
      p_staff_id: "00000000-0000-0000-0000-000000000000",
      p_start_time: new Date().toISOString(),
      p_end_time: new Date(Date.now() + 3600000).toISOString(),
      p_exclude_appointment_id: null,
    });
  } catch {
    // expected business not found
  }
  pass("RPC validate_appointment_slot exists");

  let business;

  const { data: existingBusinesses, error: bizListError } = await supabase
    .from("businesses")
    .select("id, slug, timezone, owner_id")
    .limit(1);

  if (bizListError) {
    fail("Find test business", bizListError.message);
    process.exit(1);
  }

  if (existingBusinesses?.length) {
    business = existingBusinesses[0];
    pass("Create business", business.slug);
  } else {
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (usersError || !users.users.length) {
      fail("Create business", usersError?.message ?? "No auth users to own test business");
      process.exit(1);
    }

    const ownerId = users.users[0].id;
    const slug = `p4-verify-${Date.now()}`;

    const { data: createdBusiness, error: createBizError } = await supabase
      .from("businesses")
      .insert({
        owner_id: ownerId,
        name: "Phase 4 Verify Business",
        slug,
        timezone: "America/New_York",
      })
      .select("id, slug, timezone, owner_id")
      .single();

    if (createBizError || !createdBusiness) {
      fail("Create business", createBizError?.message ?? "insert failed");
      process.exit(1);
    }

    business = createdBusiness;
    createdBusinessForTest = true;

    const defaultHours = Array.from({ length: 7 }, (_, day) => ({
      business_id: business.id,
      day_of_week: day,
      is_open: day >= 1 && day <= 5,
      open_time: "09:00:00",
      close_time: "17:00:00",
    }));

    await supabase.from("business_hours").insert(defaultHours);
    pass("Create business", business.slug);
  }

  const testDate = nextWeekdayDate(8);

  let { data: defaultLocation } = await supabase
    .from("locations")
    .select("id")
    .eq("business_id", business.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!defaultLocation) {
    const { data: locationId, error: locError } = await supabase.rpc(
      "create_default_location",
      { p_business_id: business.id },
    );
    if (locError || !locationId) {
      fail("Ensure default location", locError?.message ?? "missing location");
      process.exit(1);
    }
    defaultLocation = { id: locationId };
  }
  pass("Default location ready", defaultLocation.id);

  const { data: hours } = await supabase
    .from("business_hours")
    .select("*")
    .eq("business_id", business.id);

  if ((hours?.length ?? 0) >= 7) {
    pass("Configure business hours", `${hours.length} rows`);
  } else {
    fail("Configure business hours", `Expected 7, got ${hours?.length ?? 0}`);
  }

  const suffix = Date.now();
  const serviceNames = [`P4 Service A ${suffix}`, `P4 Service B ${suffix}`];

  const { data: services, error: serviceError } = await supabase
    .from("services")
    .insert(
      serviceNames.map((name, i) => ({
        business_id: business.id,
        location_id: defaultLocation.id,
        name,
        duration_minutes: 30 + i * 15,
        price: 50 + i * 25,
        is_active: true,
      })),
    )
    .select("id, name, duration_minutes");

  if (serviceError || !services?.length) {
    fail("Create two services", serviceError?.message ?? "insert failed");
    process.exit(1);
  }
  pass("Create two services", services.map((s) => s.name).join(", "));

  const { data: staffMembers, error: staffError } = await supabase
    .from("staff")
    .insert([
      {
        business_id: business.id,
        location_id: defaultLocation.id,
        name: `P4 Staff One ${suffix}`,
        is_active: true,
      },
      {
        business_id: business.id,
        location_id: defaultLocation.id,
        name: `P4 Staff Two ${suffix}`,
        is_active: true,
      },
    ])
    .select("id, name");

  if (staffError || !staffMembers?.length) {
    fail("Create two staff members", staffError?.message ?? "insert failed");
    process.exit(1);
  }
  pass("Create two staff members", staffMembers.map((s) => s.name).join(", "));

  const staffOne = staffMembers[0];
  const staffTwo = staffMembers[1];
  const serviceA = services[0];
  const serviceB = services[1];

  await supabase.from("staff_services").insert([
    { staff_id: staffOne.id, service_id: serviceA.id },
    { staff_id: staffOne.id, service_id: serviceB.id },
    { staff_id: staffTwo.id, service_id: serviceA.id },
  ]);
  pass("Assign services to staff");

  const slotsBeforeBlock = await rpc("get_available_slots", {
    p_business_id: business.id,
    p_service_id: serviceA.id,
    p_staff_id: staffOne.id,
    p_date: testDate,
    p_exclude_appointment_id: null,
  });

  if (!Array.isArray(slotsBeforeBlock) || slotsBeforeBlock.length === 0) {
    fail("Load slots before block", "No slots returned");
  } else {
    pass("Load slots before block", `${slotsBeforeBlock.length} slots`);
  }

  const blockStart = slotsBeforeBlock[0];
  const blockEnd = new Date(
    new Date(blockStart).getTime() + 60 * 60 * 1000,
  ).toISOString();

  const { error: blockError } = await supabase.from("availability").insert({
    business_id: business.id,
    location_id: defaultLocation.id,
    staff_id: staffOne.id,
    start_time: blockStart,
    end_time: blockEnd,
    is_available: false,
    notes: "Phase 4 test block",
  });

  if (blockError) {
    fail("Add blocked time", blockError.message);
  } else {
    pass("Add blocked time");
  }

  const slotsAfterBlock = await rpc("get_available_slots", {
    p_business_id: business.id,
    p_service_id: serviceA.id,
    p_staff_id: staffOne.id,
    p_date: testDate,
    p_exclude_appointment_id: null,
  });

  const blockedStillPresent = slotsAfterBlock?.includes(blockStart);
  if (blockedStillPresent) {
    fail("Blocked slot removed from availability");
  } else {
    pass("Blocked slot removed from availability");
  }

  const bookSlot =
    slotsAfterBlock?.find((s) => !slotsBeforeBlock.includes(s)) ??
    slotsAfterBlock?.[0] ??
    slotsBeforeBlock.find((s) => s !== blockStart);

  if (!bookSlot) {
    fail("Find bookable slot");
    process.exit(1);
  }

  const { data: customerId, error: customerError } = await supabase.rpc(
    "upsert_booking_customer",
    {
      p_business_id: business.id,
      p_name: `P4 Customer ${suffix}`,
      p_email: `p4-${suffix}@example.com`,
      p_phone: null,
    },
  );

  if (customerError || !customerId) {
    fail("Create customer", customerError?.message ?? "failed");
    process.exit(1);
  }

  const bookEnd = new Date(
    new Date(bookSlot).getTime() + serviceA.duration_minutes * 60000,
  ).toISOString();

  let appointmentId;
  try {
    appointmentId = await rpc("create_public_appointment", {
      p_business_id: business.id,
      p_service_id: serviceA.id,
      p_staff_id: staffOne.id,
      p_customer_id: customerId,
      p_start_time: bookSlot,
      p_end_time: bookEnd,
      p_notes: "Phase 4 verify",
    });
    pass("Create appointment", appointmentId);
  } catch (e) {
    fail("Create appointment", e.message);
    process.exit(1);
  }

  let overlapBlocked = false;
  try {
    await rpc("create_public_appointment", {
      p_business_id: business.id,
      p_service_id: serviceA.id,
      p_staff_id: staffOne.id,
      p_customer_id: customerId,
      p_start_time: bookSlot,
      p_end_time: bookEnd,
      p_notes: "Overlap attempt",
    });
  } catch {
    overlapBlocked = true;
  }

  if (overlapBlocked) {
    pass("Prevent overlapping appointment");
  } else {
    fail("Prevent overlapping appointment", "Second booking succeeded");
  }

  const slotsBooked = await rpc("get_available_slots", {
    p_business_id: business.id,
    p_service_id: serviceA.id,
    p_staff_id: staffOne.id,
    p_date: testDate,
    p_exclude_appointment_id: null,
  });

  if (slotsBooked?.includes(bookSlot)) {
    fail("Booked slot unavailable while active");
  } else {
    pass("Booked slot unavailable while active");
  }

  const { error: cancelError } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId);

  if (cancelError) {
    fail("Cancel appointment", cancelError.message);
  } else {
    pass("Cancel appointment");
  }

  const slotsAfterCancel = await rpc("get_available_slots", {
    p_business_id: business.id,
    p_service_id: serviceA.id,
    p_staff_id: staffOne.id,
    p_date: testDate,
    p_exclude_appointment_id: null,
  });

  if (slotsAfterCancel?.includes(bookSlot)) {
    pass("Slot available again after cancel");
  } else {
    fail("Slot available again after cancel");
  }

  const rescheduleSlot = slotsAfterCancel?.find((s) => s !== bookSlot) ?? bookSlot;
  const rescheduleEnd = new Date(
    new Date(rescheduleSlot).getTime() + serviceA.duration_minutes * 60000,
  ).toISOString();

  const { error: reopenError } = await supabase
    .from("appointments")
    .update({
      status: "confirmed",
      start_time: bookSlot,
      end_time: bookEnd,
    })
    .eq("id", appointmentId);

  if (reopenError) {
    fail("Reopen appointment for reschedule test", reopenError.message);
  }

  try {
    await rpc("validate_appointment_slot", {
      p_business_id: business.id,
      p_service_id: serviceA.id,
      p_staff_id: staffOne.id,
      p_start_time: rescheduleSlot,
      p_end_time: rescheduleEnd,
      p_exclude_appointment_id: appointmentId,
    });

    await supabase
      .from("appointments")
      .update({
        start_time: rescheduleSlot,
        end_time: rescheduleEnd,
      })
      .eq("id", appointmentId);

    pass("Reschedule appointment", rescheduleSlot);
  } catch (e) {
    fail("Reschedule appointment", e.message);
  }

  const dashboardSlots = await rpc("get_available_slots", {
    p_business_id: business.id,
    p_service_id: serviceA.id,
    p_staff_id: staffOne.id,
    p_date: testDate,
    p_exclude_appointment_id: null,
  });

  const publicSlots = await rpc("get_available_slots", {
    p_business_id: business.id,
    p_service_id: serviceA.id,
    p_staff_id: staffOne.id,
    p_date: testDate,
    p_exclude_appointment_id: null,
  });

  const sameSlots =
    JSON.stringify([...(dashboardSlots ?? [])].sort()) ===
    JSON.stringify([...(publicSlots ?? [])].sort());

  if (sameSlots) {
    pass("Dashboard and public booking share availability engine");
  } else {
    fail("Dashboard and public booking share availability engine");
  }

  const { data: calendarRows, error: calendarError } = await supabase
    .from("appointments")
    .select("id, start_time, end_time, status, staff_id, service_id")
    .eq("business_id", business.id)
    .eq("id", appointmentId)
    .single();

  if (calendarError || !calendarRows) {
    fail("Calendar API returns appointment data", calendarError?.message);
  } else if (calendarRows.start_time === rescheduleSlot) {
    pass("Calendar API returns correct data", calendarRows.start_time);
  } else {
    fail("Calendar API returns correct data", "start_time mismatch");
  }

  const publicAppts = await rpc("get_public_appointments", {
    p_business_id: business.id,
    p_start: `${testDate}T00:00:00.000Z`,
    p_end: `${testDate}T23:59:59.999Z`,
  });

  const listed = publicAppts?.some(
    (row) => row.staff_id === staffOne.id && row.start_time === rescheduleSlot,
  );

  if (listed) {
    pass("Public appointments RPC lists rescheduled slot");
  } else {
    fail("Public appointments RPC lists rescheduled slot");
  }

  // Cleanup test artifacts
  await supabase.from("appointments").delete().eq("id", appointmentId);
  await supabase.from("availability").delete().eq("notes", "Phase 4 test block");
  await supabase.from("staff_services").delete().in("staff_id", [staffOne.id, staffTwo.id]);
  await supabase.from("staff").delete().in("id", [staffOne.id, staffTwo.id]);
  await supabase.from("services").delete().in("id", [serviceA.id, serviceB.id]);
  await supabase.from("customers").delete().eq("id", customerId);
  if (createdBusinessForTest) {
    await supabase.from("business_hours").delete().eq("business_id", business.id);
    await supabase.from("businesses").delete().eq("id", business.id);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length) {
    process.exit(1);
  }

  console.log("\nPhase 4 scheduling verification complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
