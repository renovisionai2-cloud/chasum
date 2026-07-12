/**
 * Production readiness audit for business data integrity.
 * Usage: node scripts/audit-business-readiness.mjs [owner-email]
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
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!url || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const ownerEmail = process.argv[2] ?? process.env.AUDIT_OWNER_EMAIL ?? null;

const BUSINESS_CHILD_TABLES = [
  "business_hours",
  "services",
  "staff",
  "customers",
  "appointments",
  "holidays",
  "availability",
  "calendar_connections",
  "notifications",
  "notification_logs",
  "api_keys",
  "webhook_endpoints",
  "recurring_rules",
  "waitlists",
  "background_jobs",
];

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function resolveOwnerEmail(preferredSlug = "dardin-gvm") {
  if (ownerEmail) return ownerEmail;

  const { data: business } = await sb
    .from("businesses")
    .select("owner_id, slug")
    .eq("slug", preferredSlug)
    .maybeSingle();

  if (!business) {
    throw new Error(
      `Could not resolve owner email. Pass email argument or create slug ${preferredSlug}.`,
    );
  }

  const { data: userData, error } = await sb.auth.admin.getUserById(
    business.owner_id,
  );
  if (error || !userData.user?.email) {
    throw new Error(error?.message ?? "Owner user not found");
  }
  return userData.user.email;
}

const checks = [];

function pass(name, detail = "") {
  checks.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  checks.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function count(table, filter) {
  let q = sb.from(table).select("id", { count: "exact", head: true });
  for (const [col, val] of Object.entries(filter)) {
    q = q.eq(col, val);
  }
  const { count, error } = await q;
  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

async function main() {
  console.log("Production readiness audit\n");

  const resolvedEmail = await resolveOwnerEmail();
  console.log(`Owner email: ${resolvedEmail}\n`);

  const list = await sb.auth.admin.listUsers({ perPage: 1000 });
  const users = list.data?.users ?? [];
  const owner = users.find((u) => u.email === resolvedEmail);

  if (!owner) {
    fail("Resolve owner account", `No user found for ${resolvedEmail}`);
    summarize(false);
    return;
  }

  pass("Resolve owner account", owner.id);

  const { data: businesses, error: bizError } = await sb
    .from("businesses")
    .select("*")
    .eq("owner_id", owner.id)
    .order("created_at", { ascending: true });

  if (bizError) {
    fail("Load owner businesses", bizError.message);
    summarize(false);
    return;
  }

  if (businesses.length === 1) {
    pass("Exactly one business row for owner", businesses[0].slug);
  } else {
    fail(
      "Exactly one business row for owner",
      `Found ${businesses.length}: ${businesses.map((b) => b.slug).join(", ")}`,
    );
  }

  const canonical = businesses[0] ?? null;
  if (!canonical) {
    summarize(false);
    return;
  }

  const { data: allBusinessIds } = await sb.from("businesses").select("id");
  const validIds = new Set((allBusinessIds ?? []).map((b) => b.id));
  const deletedIds = [
    "9911ffda-b9e5-40fd-b8f0-4cb9ca140e0c",
    "4392143f-cd5c-4986-84a6-06dec9b2f728",
    "d72e1a66-f646-4706-b19c-218ac7ec1361",
    "8be888e5-db16-4a40-87d4-0588361c018c",
    "83a968cc-d73e-43a8-8a15-71754b029b50",
    "4eeeafbe-a223-4b33-a9c1-f227ad12e35f",
    "d9291333-a33e-4692-b6c2-a09cee61006a",
    "c3dd1b6a-d8c3-4f1f-b7a9-16eb0f301380",
    "0d3f71af-57ee-4b56-be1f-de4e17714865",
  ];

  let orphanIssues = 0;
  for (const deletedId of deletedIds) {
    if (validIds.has(deletedId)) {
      fail("Deleted business removed", `Still exists: ${deletedId}`);
      orphanIssues += 1;
    }
  }
  if (orphanIssues === 0) {
    pass("Deleted duplicate businesses removed from DB");
  }

  for (const table of BUSINESS_CHILD_TABLES) {
    const { data: rows, error } = await sb
      .from(table)
      .select("business_id")
      .not("business_id", "is", null);

    if (error) {
      if (error.code === "42P01") continue;
      fail(`Orphan check: ${table}`, error.message);
      orphanIssues += 1;
      continue;
    }

    const orphans = (rows ?? []).filter((r) => !validIds.has(r.business_id));
    if (orphans.length > 0) {
      fail(`Orphan check: ${table}`, `${orphans.length} rows reference missing businesses`);
      orphanIssues += 1;
    }
  }

  if (orphanIssues === 0) {
    pass("No orphaned child rows referencing deleted businesses");
  }

  const { data: externalViaConnection, error: extError } = await sb
    .from("external_events")
    .select("id, calendar_connections!inner(business_id)");

  if (extError) {
    fail("Orphan check: external_events", extError.message);
  } else {
    const extOrphans = (externalViaConnection ?? []).filter(
      (row) => !validIds.has(row.calendar_connections.business_id),
    );
    if (extOrphans.length > 0) {
      fail("Orphan check: external_events", `${extOrphans.length} orphaned via calendar_connections`);
    } else {
      pass("Orphan check: external_events via calendar_connections");
    }
  }

  for (const table of BUSINESS_CHILD_TABLES) {
    const result = await count(table, { business_id: canonical.id });
    if (result.error) {
      if (result.error.includes("does not exist")) continue;
      fail(`Canonical FK: ${table}`, result.error);
    }
  }
  pass("All child tables scoped to valid business IDs", `canonical=${canonical.slug}`);

  const { data: bySlug, error: slugError } = await sb
    .from("businesses")
    .select("id, name, slug, owner_id")
    .eq("slug", canonical.slug)
    .maybeSingle();

  if (slugError) {
    fail("Public slug lookup", slugError.message);
  } else if (!bySlug || bySlug.id !== canonical.id) {
    fail("Public slug lookup", "Slug does not resolve to canonical business");
  } else {
    pass("Public booking slug resolves to canonical business", `${appUrl}/book/${canonical.slug}`);
  }

  const { data: indexes } = await sb
    .from("businesses")
    .select("owner_id")
    .eq("owner_id", owner.id);

  if ((indexes?.length ?? 0) > 1) {
    fail("Unique owner constraint effective", `Still ${indexes.length} rows`);
  } else {
    pass("Unique owner constraint effective");
  }

  const hours = await count("business_hours", { business_id: canonical.id });
  if (hours.count === 7) {
    pass("Canonical business has default hours", "7 rows");
  } else {
    fail("Canonical business has default hours", `Expected 7, got ${hours.count}`);
  }

  for (const table of ["staff_working_hours", "staff_vacations"]) {
    const { data: rows, error } = await sb
      .from(table)
      .select(`id, staff!inner(business_id)`);

    if (error) {
      if (error.code === "42P01") continue;
      fail(`Orphan check: ${table}`, error.message);
      continue;
    }

    const orphans = (rows ?? []).filter(
      (row) => !validIds.has(row.staff.business_id),
    );
    if (orphans.length > 0) {
      fail(`Orphan check: ${table}`, `${orphans.length} orphaned via staff`);
    } else {
      pass(`Orphan check: ${table} via staff`);
    }
  }

  const apptOnCanonical = await count("appointments", {
    business_id: canonical.id,
  });
  const apptElsewhere = await sb
    .from("appointments")
    .select("id, business_id")
    .neq("business_id", canonical.id);

  if (apptElsewhere.error) {
    fail("Appointments scoped to owner businesses", apptElsewhere.error.message);
  } else if ((apptElsewhere.data ?? []).some((a) => a.business_id === owner.id)) {
    fail("Appointments scoped to owner businesses", "Found appointment on non-canonical owner business");
  } else {
    pass(
      "Appointments scoped to canonical business",
      `${apptOnCanonical.count ?? 0} on canonical, 0 on deleted`,
    );
  }

  summarize(checks.every((c) => c.ok));
}

function summarize(ok) {
  const passed = checks.filter((c) => c.ok).length;
  console.log(`\n${passed}/${checks.length} checks passed`);
  if (ok) {
    console.log("\nDatabase is clean and ready for production data.");
  } else {
    console.error("\nAudit FAILED — resolve issues before production data.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
