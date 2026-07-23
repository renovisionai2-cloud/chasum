/**
 * Operation GVM – Commerce engine smoke verification (read/write via service role).
 * Does not print secrets. Creates a temporary ledger row then deletes it when possible.
 *
 * Usage: node scripts/verify-commerce-engine.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      for (const line of readFileSync(resolve(name), "utf8").split("\n")) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const i = line.indexOf("=");
        const k = line.slice(0, i).trim();
        if (!process.env[k]) process.env[k] = line.slice(i + 1).trim();
      }
    } catch {
      /* optional */
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let failed = 0;
function check(label, ok, detail = "") {
  if (ok) console.log(`[OK] ${label}${detail ? ` — ${detail}` : ""}`);
  else {
    failed += 1;
    console.error(`[FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const { error: txErr, count: txCount } = await sb
  .from("commerce_transactions")
  .select("*", { count: "exact", head: true });
check("commerce_transactions visible", !txErr, txErr?.message ?? `count=${txCount}`);

for (const col of ["payment_status", "amount_paid_cents", "amount_refunded_cents"]) {
  const { error } = await sb.from("appointments").select(col).limit(1);
  check(`appointments.${col}`, !error, error?.message);
}

const { error: scErr } = await sb.from("customers").select("store_credit_cents").limit(1);
check("customers.store_credit_cents", !scErr, scErr?.message);

const { data: biz } = await sb.from("businesses").select("id").eq("slug", "gvm-baby-world").maybeSingle();
check("GVM business present", Boolean(biz?.id));

if (biz?.id) {
  const { data: customer } = await sb
    .from("customers")
    .select("id")
    .eq("business_id", biz.id)
    .limit(1)
    .maybeSingle();
  check("GVM has a customer", Boolean(customer?.id));

  if (customer?.id) {
    const { data: row, error: insertErr } = await sb
      .from("commerce_transactions")
      .insert({
        business_id: biz.id,
        customer_id: customer.id,
        kind: "payment",
        status: "succeeded",
        method: "cash",
        amount_cents: 100,
        currency: "usd",
        provider: "manual",
        description: "commerce-engine-verify (safe to delete)",
      })
      .select("id")
      .single();
    check("insert ledger payment", !insertErr && Boolean(row?.id), insertErr?.message);
    if (row?.id) {
      await sb.from("commerce_transactions").delete().eq("id", row.id);
      check("cleanup verify row", true);
    }
  }
}

console.log("");
if (failed > 0) {
  console.error(`Commerce engine verification failed (${failed}).`);
  process.exit(1);
}
console.log("Commerce engine verification passed.");
