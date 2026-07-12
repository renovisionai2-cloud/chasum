/**
 * Verify ensure_business_for_owner is idempotent under concurrent calls.
 * Usage: node scripts/verify-business-concurrency.mjs
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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Missing Supabase env vars");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stamp = Date.now();
const email = `concurrency-${stamp}@chasum-verify.local`;
const password = `Verify-${stamp}!`;

async function main() {
  console.log("Business concurrency verification\n");

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Failed to create test user");
  }

  const ownerId = created.user.id;

  const userClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInError } = await userClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw new Error(signInError.message);
  }

  const preferredSlug = `concurrency-test-${stamp}`;
  const calls = Array.from({ length: 5 }, () =>
    userClient.rpc("ensure_business_for_owner", {
      p_name: "Concurrency Test Business",
      p_preferred_slug: preferredSlug,
    }),
  );

  const results = await Promise.all(calls);
  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    throw new Error(
      `RPC failures: ${errors.map((r) => r.error?.message).join("; ")}`,
    );
  }

  const businessIds = new Set(
    results.map((r) => r.data?.id).filter(Boolean),
  );

  const { data: rows, error: listError } = await admin
    .from("businesses")
    .select("id, slug, owner_id")
    .eq("owner_id", ownerId);

  if (listError) throw new Error(listError.message);

  console.log(`Parallel RPC calls: 5`);
  console.log(`Distinct business IDs returned: ${businessIds.size}`);
  console.log(`Business rows for owner: ${rows?.length ?? 0}`);

  if (businessIds.size !== 1) {
    throw new Error(`Expected 1 distinct business ID, got ${businessIds.size}`);
  }

  if ((rows?.length ?? 0) !== 1) {
    throw new Error(`Expected 1 business row, got ${rows?.length ?? 0}`);
  }

  const { count: hoursCount, error: hoursError } = await admin
    .from("business_hours")
    .select("id", { count: "exact", head: true })
    .eq("business_id", rows[0].id);

  if (hoursError) throw new Error(hoursError.message);

  if (hoursCount !== 7) {
    throw new Error(`Expected 7 business_hours rows, got ${hoursCount}`);
  }

  await admin.from("businesses").delete().eq("owner_id", ownerId);
  await admin.auth.admin.deleteUser(ownerId);

  console.log("\n5/5 checks passed — concurrent ensure is idempotent.");
}

main().catch((err) => {
  console.error(`\nVerification failed: ${err.message}`);
  process.exit(1);
});
