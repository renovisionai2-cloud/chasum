/**
 * Functional audit: settings scope + appointment insert on canonical business.
 * Usage: node scripts/audit-business-functional.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { addMinutes } from "date-fns";

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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function main() {
  console.log("Functional audit (canonical business writes)\n");

  const { data: canonical, error: bizError } = await sb
    .from("businesses")
    .select("*")
    .eq("slug", "gvm-baby-world")
    .single();

  if (bizError || !canonical) {
    throw new Error(bizError?.message ?? "Canonical business not found (gvm-baby-world)");
  }

  const originalName = canonical.name;
  const newName = "GVM Audit Test Name";
  const { error: updateError } = await sb
    .from("businesses")
    .update({ name: newName })
    .eq("id", canonical.id);

  if (updateError) throw new Error(updateError.message);

  const { data: afterUpdate } = await sb
    .from("businesses")
    .select("name")
    .eq("id", canonical.id)
    .single();

  if (afterUpdate?.name !== newName) {
    throw new Error("Settings-style update did not persist on canonical business");
  }

  await sb
    .from("businesses")
    .update({ name: originalName })
    .eq("id", canonical.id);

  console.log("✓ Settings-style update targets canonical business row");

  let { data: defaultLocation } = await sb
    .from("locations")
    .select("id")
    .eq("business_id", canonical.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!defaultLocation) {
    const { data: locId, error: locErr } = await sb.rpc("create_default_location", {
      p_business_id: canonical.id,
    });
    if (locErr || !locId) throw new Error(locErr?.message ?? "No default location");
    defaultLocation = { id: locId };
  }

  const { data: service, error: serviceError } = await sb
    .from("services")
    .insert({
      business_id: canonical.id,
      location_id: defaultLocation.id,
      name: "Audit Temp Service",
      duration_minutes: 30,
      price: 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (serviceError) throw new Error(serviceError.message);

  const { data: staff, error: staffError } = await sb
    .from("staff")
    .insert({
      business_id: canonical.id,
      location_id: defaultLocation.id,
      name: "Audit Temp Staff",
      is_active: true,
    })
    .select("id")
    .single();

  if (staffError) throw new Error(staffError.message);

  await sb.from("staff_services").insert({
    staff_id: staff.id,
    service_id: service.id,
  });

  const { data: customer, error: customerError } = await sb
    .from("customers")
    .insert({
      business_id: canonical.id,
      name: "Audit Temp Client",
      email: `audit-${Date.now()}@chasum.local`,
    })
    .select("id")
    .single();

  if (customerError) throw new Error(customerError.message);

  const start = new Date();
  start.setDate(start.getDate() + 14);
  start.setHours(10, 0, 0, 0);
  const end = addMinutes(start, 30);

  const { data: appointment, error: apptError } = await sb
    .from("appointments")
    .insert({
      business_id: canonical.id,
      location_id: defaultLocation.id,
      service_id: service.id,
      staff_id: staff.id,
      customer_id: customer.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      status: "pending",
    })
    .select("id, business_id")
    .single();

  if (apptError) throw new Error(apptError.message);

  if (appointment.business_id !== canonical.id) {
    throw new Error("Appointment stored under wrong business_id");
  }

  console.log("✓ Appointment insert stored under canonical business");

  await sb.from("appointments").delete().eq("id", appointment.id);
  await sb.from("customers").delete().eq("id", customer.id);
  await sb.from("staff_services").delete().eq("staff_id", staff.id);
  await sb.from("staff").delete().eq("id", staff.id);
  await sb.from("services").delete().eq("id", service.id);

  console.log("✓ Audit fixtures cleaned up");
  console.log("\nFunctional audit passed.");
}

main().catch((err) => {
  console.error(`Functional audit failed: ${err.message}`);
  process.exit(1);
});
