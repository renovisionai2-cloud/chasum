/**
 * Configure GVM Baby World Ultrasound as the first production tenant.
 * Idempotent: renames business, ensures ultrasound services, staff assignments.
 * Does NOT create demo customers or appointments.
 *
 * Usage: node scripts/setup-gvm-baby-world.mjs
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

const TARGET_NAME = "GVM Baby World Ultrasound";
const TARGET_SLUG = "gvm-baby-world";
const SOURCE_SLUGS = ["dardin-gvm", "gvm-baby-world"];

/** Elective ultrasound catalog — owner can adjust prices in dashboard. */
const SERVICE_CATALOG = [
  {
    name: "2D Ultrasound",
    description:
      "Standard 2D ultrasound session to view your baby and confirm wellbeing.",
    category: "Ultrasound",
    duration_minutes: 30,
    price: 75,
    color: "#2563EB",
    buffer_before_minutes: 5,
    buffer_after_minutes: 10,
    preparation_instructions:
      "Drink 24 oz of water 45 minutes before your appointment and avoid emptying your bladder.",
    online_booking: true,
  },
  {
    name: "Gender Reveal Ultrasound",
    description:
      "Focused session to determine baby’s gender, typically from 16 weeks.",
    category: "Ultrasound",
    duration_minutes: 30,
    price: 89,
    color: "#0D9488",
    buffer_before_minutes: 5,
    buffer_after_minutes: 10,
    preparation_instructions:
      "Best after 16 weeks. Drink water before arrival for clearer imaging.",
    online_booking: true,
  },
  {
    name: "3D/4D Ultrasound",
    description:
      "Detailed 3D stills and 4D motion imaging for keepsake memories.",
    category: "Ultrasound",
    duration_minutes: 45,
    price: 149,
    color: "#EA580C",
    buffer_before_minutes: 10,
    buffer_after_minutes: 15,
    preparation_instructions:
      "Recommended between 26–32 weeks. Arrive hydrated; avoid lotions on the belly.",
    online_booking: true,
  },
  {
    name: "5D HDLive Ultrasound",
    description:
      "Premium HDLive imaging with enhanced depth and realism.",
    category: "Ultrasound",
    duration_minutes: 60,
    price: 199,
    color: "#7C3AED",
    buffer_before_minutes: 10,
    buffer_after_minutes: 15,
    preparation_instructions:
      "Ideal between 27–32 weeks. Come hydrated and wear comfortable clothing.",
    online_booking: true,
  },
  {
    name: "Heartbeat Recording",
    description:
      "Capture and take home a recording of your baby’s heartbeat.",
    category: "Ultrasound",
    duration_minutes: 15,
    price: 45,
    color: "#DC2626",
    buffer_before_minutes: 0,
    buffer_after_minutes: 5,
    preparation_instructions:
      "No special preparation. Can be added to another ultrasound visit.",
    online_booking: true,
  },
];

const BOOKING_POLICY =
  "Appointments can be booked online up to the studio’s advance booking window. Please arrive 10 minutes early to complete check-in.";
const CANCELLATION_POLICY =
  "Please cancel or reschedule at least 24 hours before your appointment. Late cancellations or no-shows may forfeit the session fee.";

async function resolveBusiness() {
  for (const slug of SOURCE_SLUGS) {
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  const { data: byName, error: nameError } = await supabase
    .from("businesses")
    .select("*")
    .ilike("name", "%gvm%")
    .limit(1)
    .maybeSingle();
  if (nameError) throw nameError;
  if (byName) return byName;

  throw new Error(
    "GVM business not found. Expected slug dardin-gvm or gvm-baby-world.",
  );
}

async function ensureDefaultLocation(businessId) {
  const { data: existing } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_default", true)
    .maybeSingle();

  if (existing) return existing;

  const { data: anyLoc } = await supabase
    .from("locations")
    .select("*")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!anyLoc) {
    throw new Error("No location found for GVM business. Run Phase 5 migrations.");
  }
  return anyLoc;
}

async function main() {
  console.log("GVM Baby World Ultrasound — production setup\n");

  const business = await resolveBusiness();
  console.log(`Found business: ${business.name} (${business.slug})`);

  const { data: owner } = await supabase.auth.admin.getUserById(
    business.owner_id,
  );
  const ownerEmail = owner?.user?.email ?? null;

  const { error: bizError } = await supabase
    .from("businesses")
    .update({
      name: TARGET_NAME,
      slug: TARGET_SLUG,
      timezone: business.timezone || "America/New_York",
      email: business.email || ownerEmail,
      booking_policy: business.booking_policy || BOOKING_POLICY,
      cancellation_policy:
        business.cancellation_policy || CANCELLATION_POLICY,
      public_booking_mode: "public",
      country: business.country || "US",
    })
    .eq("id", business.id);

  if (bizError) throw bizError;
  console.log(`✓ Renamed to ${TARGET_NAME} /book/${TARGET_SLUG}`);

  const location = await ensureDefaultLocation(business.id);

  const locationName =
    !location.name ||
    /main/i.test(location.name) ||
    /darshan/i.test(location.name)
      ? "Studio"
      : location.name;

  await supabase
    .from("locations")
    .update({
      name: locationName,
      timezone: location.timezone || business.timezone || "America/New_York",
    })
    .eq("id", location.id);
  console.log(`✓ Location: ${locationName}`);

  await supabase
    .from("location_settings")
    .update({
      cancellation_policy:
        business.cancellation_policy || CANCELLATION_POLICY,
    })
    .eq("location_id", location.id);

  // Ensure location hours exist (copy from business_hours if empty)
  const { data: locHours } = await supabase
    .from("location_hours")
    .select("id")
    .eq("location_id", location.id);

  if (!locHours?.length) {
    const { data: bizHours } = await supabase
      .from("business_hours")
      .select("*")
      .eq("business_id", business.id);

    if (bizHours?.length) {
      await supabase.from("location_hours").insert(
        bizHours.map((h) => ({
          location_id: location.id,
          day_of_week: h.day_of_week,
          is_open: h.is_open,
          open_time: h.open_time,
          close_time: h.close_time,
        })),
      );
      console.log("✓ Seeded location hours from business hours");
    }
  }

  const { data: existingServices, error: svcListError } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id);
  if (svcListError) throw svcListError;

  const serviceByName = new Map(
    (existingServices ?? []).map((s) => [s.name.toLowerCase(), s]),
  );

  const ensuredServices = [];
  for (const catalog of SERVICE_CATALOG) {
    const existing = serviceByName.get(catalog.name.toLowerCase());
    if (existing) {
      const { data: updated, error } = await supabase
        .from("services")
        .update({
          description: catalog.description,
          category: catalog.category,
          duration_minutes: catalog.duration_minutes,
          price: catalog.price,
          color: catalog.color,
          buffer_before_minutes: catalog.buffer_before_minutes,
          buffer_after_minutes: catalog.buffer_after_minutes,
          preparation_instructions: catalog.preparation_instructions,
          online_booking: true,
          is_active: true,
          location_id: existing.location_id || location.id,
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      ensuredServices.push(updated);
      console.log(`✓ Updated service: ${catalog.name}`);
    } else {
      const { data: created, error } = await supabase
        .from("services")
        .insert({
          business_id: business.id,
          location_id: location.id,
          ...catalog,
          is_active: true,
        })
        .select("*")
        .single();
      if (error) throw error;
      ensuredServices.push(created);
      console.log(`✓ Created service: ${catalog.name}`);
    }
  }

  // Staff: prefer existing active staff; otherwise create owner as provider
  let { data: staffList } = await supabase
    .from("staff")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true);

  if (!staffList?.length) {
    const ownerName =
      owner?.user?.user_metadata?.full_name ||
      owner?.user?.user_metadata?.name ||
      (ownerEmail ? ownerEmail.split("@")[0] : null) ||
      "Studio Provider";

    const { data: createdStaff, error: staffError } = await supabase
      .from("staff")
      .insert({
        business_id: business.id,
        location_id: location.id,
        name: ownerName,
        email: ownerEmail,
        title: "Sonographer",
        color: "#2563EB",
        is_active: true,
        biography:
          "Experienced elective ultrasound provider dedicated to a calm, memorable visit for every family.",
        qualifications:
          "Trained in elective obstetric ultrasound imaging (2D–5D HDLive).",
      })
      .select("*")
      .single();
    if (staffError) throw staffError;
    staffList = [createdStaff];
    console.log(`✓ Created staff member: ${ownerName}`);
  } else {
    for (const member of staffList) {
      const patch = {
        location_id: member.location_id || location.id,
      };
      if (!member.biography) {
        patch.biography =
          "Experienced elective ultrasound provider dedicated to a calm, memorable visit for every family.";
      }
      if (!member.qualifications) {
        patch.qualifications =
          "Trained in elective obstetric ultrasound imaging (2D–5D HDLive).";
      }
      if (!member.title) patch.title = "Sonographer";
      await supabase.from("staff").update(patch).eq("id", member.id);
    }
    console.log(`✓ Ensured ${staffList.length} staff profile field(s)`);
  }

  for (const member of staffList) {
    const { data: existingLinks } = await supabase
      .from("staff_services")
      .select("service_id")
      .eq("staff_id", member.id);
    const linked = new Set((existingLinks ?? []).map((r) => r.service_id));

    for (const service of ensuredServices) {
      if (linked.has(service.id)) continue;
      const { error } = await supabase
        .from("staff_services")
        .insert({ staff_id: member.id, service_id: service.id });
      if (error) {
        console.warn(
          `  staff_services warn (${member.name} → ${service.name}): ${error.message}`,
        );
      }
    }
  }
  console.log("✓ Assigned all ultrasound services to active staff");

  console.log("\nDone.");
  console.log(`Public booking: /book/${TARGET_SLUG}`);
  console.log(
    "No demo customers or appointments were created. Book a real session to verify the flow.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
