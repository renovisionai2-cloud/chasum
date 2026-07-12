/**
 * One-time cleanup for duplicate businesses created by concurrent getOrCreateBusiness().
 *
 * Keeps the oldest business row per owner_id (matches app findOwnedBusiness()).
 * Deletes newer duplicates. FK ON DELETE CASCADE removes their default business_hours only.
 *
 * Usage:
 *   node scripts/cleanup-duplicate-businesses.mjs           # dry run (default)
 *   node scripts/cleanup-duplicate-businesses.mjs --execute # perform deletes
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

const execute = process.argv.includes("--execute");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const OPERATIONAL_TABLES = [
  "services",
  "staff",
  "customers",
  "appointments",
  "holidays",
  "availability_blocks",
  "calendar_connections",
  "notifications",
  "api_keys",
  "webhook_endpoints",
  "recurring_rules",
  "waitlists",
];

async function countRows(table, businessId) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  if (error) return { error: error.message };
  return { count: count ?? 0 };
}

async function main() {
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id, owner_id, name, slug, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  const byOwner = new Map();
  for (const business of businesses) {
    const list = byOwner.get(business.owner_id) ?? [];
    list.push(business);
    byOwner.set(business.owner_id, list);
  }

  const keep = [];
  const remove = [];

  for (const [, rows] of byOwner) {
    rows.sort((a, b) => a.created_at.localeCompare(b.created_at));
    keep.push(rows[0]);
    remove.push(...rows.slice(1));
  }

  console.log(`Mode: ${execute ? "EXECUTE" : "DRY RUN"}`);
  console.log(`Total businesses: ${businesses.length}`);
  console.log(`Owners: ${byOwner.size}`);
  console.log(`Canonical rows to keep: ${keep.length}`);
  console.log(`Duplicate rows to delete: ${remove.length}\n`);

  if (remove.length === 0) {
    console.log("No duplicate businesses found.");
    return;
  }

  console.log("=== Keep (canonical per owner) ===");
  for (const business of keep) {
    console.log(
      `  ${business.slug}  id=${business.id}  created=${business.created_at}`,
    );
  }

  console.log("\n=== Delete (duplicates) ===");
  let blocked = 0;

  for (const business of remove) {
    const operational = {};
    let hasOperationalData = false;

    for (const table of OPERATIONAL_TABLES) {
      const result = await countRows(table, business.id);
      operational[table] = result.error ?? result.count;
      if (!result.error && result.count > 0) {
        hasOperationalData = true;
      }
    }

    const { count: hoursCount } = await countRows("business_hours", business.id);

    console.log(`  ${business.slug}`);
    console.log(`    id=${business.id}  created=${business.created_at}`);
    console.log(
      `    related: business_hours=${hoursCount ?? 0}, operational=${JSON.stringify(operational)}`,
    );

    if (hasOperationalData) {
      console.log("    SKIPPED — has operational data (would not delete)");
      blocked += 1;
    } else if (execute) {
      const { error: deleteError } = await supabase
        .from("businesses")
        .delete()
        .eq("id", business.id);

      if (deleteError) {
        console.log(`    DELETE FAILED: ${deleteError.message}`);
        blocked += 1;
      } else {
        console.log("    DELETED");
      }
    } else {
      console.log("    would delete (+ cascade ~7 default business_hours rows)");
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Safe to delete: ${remove.length - blocked}`);
  console.log(`Blocked / skipped: ${blocked}`);

  if (!execute) {
    console.log("\nNo changes made. Re-run with --execute to apply deletes.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
