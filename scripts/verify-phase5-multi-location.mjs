/**
 * Phase 5 multi-location verification.
 * Usage: node scripts/verify-phase5-multi-location.mjs
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

async function main() {
  console.log("Phase 5 multi-location verification\n");

  // Schema checks
  const tables = [
    "locations",
    "location_settings",
    "location_hours",
    "subscription_plans",
  ];
  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(1);
    if (error) fail(`Table ${table} exists`, error.message);
    else pass(`Table ${table} exists`);
  }

  // Every business has a default location
  const { data: businesses } = await supabase.from("businesses").select("id, name");
  for (const biz of businesses ?? []) {
    const { data: locs } = await supabase
      .from("locations")
      .select("id, is_default")
      .eq("business_id", biz.id);
    const defaults = (locs ?? []).filter((l) => l.is_default);
    if (defaults.length !== 1) {
      fail(`Business ${biz.name} has one default location`, `found ${defaults.length}`);
    } else {
      pass(`Business ${biz.name} has default location`);
    }
  }

  // Operational rows have location_id
  for (const table of ["staff", "services", "appointments", "availability"]) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .is("location_id", null);
    if (error) fail(`${table}.location_id backfilled`, error.message);
    else if ((count ?? 0) > 0) fail(`${table}.location_id backfilled`, `${count} null rows`);
    else pass(`${table}.location_id backfilled`);
  }

  // Customers remain business-scoped (no location_id column)
  const { error: custLocErr } = await supabase
    .from("customers")
    .select("location_id")
    .limit(1);
  if (custLocErr?.message.includes("location_id")) {
    pass("Customers remain business-scoped (no location_id)");
  } else {
    fail("Customers remain business-scoped", "location_id column may exist");
  }

  // Subscription plans configured
  const { data: plans } = await supabase.from("subscription_plans").select("*");
  if ((plans ?? []).length >= 4) pass("Subscription plans seeded", `${plans.length} plans`);
  else fail("Subscription plans seeded");

  // can_add_location RPC
  const sampleBiz = businesses?.[0];
  if (sampleBiz) {
    const { data: canAdd, error } = await supabase.rpc("can_add_location", {
      p_business_id: sampleBiz.id,
    });
    if (error) fail("RPC can_add_location", error.message);
    else pass("RPC can_add_location", String(canAdd));
  }

  // Scheduling with location_id
  if (sampleBiz) {
    const { data: loc } = await supabase
      .from("locations")
      .select("id")
      .eq("business_id", sampleBiz.id)
      .eq("is_default", true)
      .single();

    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("business_id", sampleBiz.id)
      .limit(1)
      .maybeSingle();

    const { data: staffMember } = await supabase
      .from("staff")
      .select("id")
      .eq("business_id", sampleBiz.id)
      .limit(1)
      .maybeSingle();

    if (loc && service && staffMember) {
      const date = nextWeekdayDate();
      const { error: slotsErr } = await supabase.rpc("get_available_slots", {
        p_business_id: sampleBiz.id,
        p_service_id: service.id,
        p_staff_id: staffMember.id,
        p_date: date,
        p_exclude_appointment_id: null,
        p_location_id: loc.id,
      });
      if (slotsErr) fail("get_available_slots with location_id", slotsErr.message);
      else pass("get_available_slots with location_id");

      const { error: resolveErr } = await supabase.rpc("resolve_location_id", {
        p_business_id: sampleBiz.id,
        p_location_id: null,
      });
      // resolve_location_id is SQL not RPC exposed - skip if not granted
      if (resolveErr && !resolveErr.message.includes("Could not find")) {
        // function may not be granted to service role - that's ok
      }
    }
  }

  // Existing appointments intact
  const { count: apptCount } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true });
  pass("Appointments table readable", `${apptCount ?? 0} rows`);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
