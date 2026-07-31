/**
 * Grant GVM Baby World Private Alpha co-owner access.
 *
 * - Enables private_alpha_enabled on the live GVM tenant only
 * - Adds bobitadar@hotmail.com as business_members.role = owner
 * - Keeps subscription_plan_key = starter (Free)
 * - Does NOT create Stripe subscriptions
 * - Does NOT add platform_admins
 *
 * Usage: node scripts/grant-gvm-private-alpha-owner.mjs
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

/** Live GVM tenant used in Private Alpha testing (greeting "GVM"). */
const TARGET_SLUG = "gvm-baby-world-ultrasound";
const PARTNER_EMAIL = "bobitadar@hotmail.com";

async function main() {
  console.log("=== Grant GVM Private Alpha Owner Access ===\n");

  const { data: business, error: bizErr } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, owner_id, subscription_plan_key, subscription_status, stripe_customer_id, stripe_subscription_id, private_alpha_enabled",
    )
    .eq("slug", TARGET_SLUG)
    .maybeSingle();

  if (bizErr) {
    console.error("Business lookup failed:", bizErr.message);
    console.error(
      "If private_alpha_enabled is missing, apply migration 032_private_alpha_co_owners.sql first.",
    );
    process.exit(1);
  }
  if (!business) {
    console.error(`Business slug=${TARGET_SLUG} not found.`);
    process.exit(1);
  }

  console.log("Target business:", {
    id: business.id,
    name: business.name,
    slug: business.slug,
    plan: business.subscription_plan_key,
    status: business.subscription_status,
    stripeSub: business.stripe_subscription_id,
    privateAlpha: business.private_alpha_enabled,
  });

  const { data: list } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const partner = (list?.users ?? []).find(
    (u) => u.email?.toLowerCase() === PARTNER_EMAIL.toLowerCase(),
  );
  if (!partner) {
    console.error(`Auth user not found for ${PARTNER_EMAIL}`);
    process.exit(1);
  }
  console.log("Partner user:", { id: partner.id, email: partner.email });

  // Enable Private Alpha override; preserve Free plan; clear any accidental Stripe sub refs (do not create).
  const { data: updatedBiz, error: updErr } = await supabase
    .from("businesses")
    .update({
      private_alpha_enabled: true,
      subscription_plan_key: "starter",
      subscription_status: "active",
      // Explicitly leave Stripe null — no paid subscription.
      stripe_subscription_id: null,
    })
    .eq("id", business.id)
    .select(
      "id, slug, subscription_plan_key, subscription_status, stripe_customer_id, stripe_subscription_id, private_alpha_enabled",
    )
    .single();

  if (updErr) {
    console.error("Failed to enable private_alpha_enabled:", updErr.message);
    process.exit(1);
  }
  console.log("Private Alpha enabled:", updatedBiz);

  const { data: membership, error: memErr } = await supabase
    .from("business_members")
    .upsert(
      {
        business_id: business.id,
        user_id: partner.id,
        role: "owner",
      },
      { onConflict: "business_id,user_id" },
    )
    .select("*")
    .single();

  if (memErr) {
    console.error("Failed to upsert business_members:", memErr.message);
    process.exit(1);
  }
  console.log("Co-owner membership:", membership);

  // Link staff profile "Bobita Singh" if present (cosmetic; auth uses membership).
  const { data: staffRows } = await supabase
    .from("staff")
    .select("id, name, role_key, user_id")
    .eq("business_id", business.id)
    .ilike("name", "%bobita%");

  if (staffRows?.length) {
    for (const s of staffRows) {
      await supabase
        .from("staff")
        .update({ user_id: partner.id, role_key: "owner", is_active: true })
        .eq("id", s.id);
    }
    console.log(
      "Linked staff rows:",
      staffRows.map((s) => s.name).join(", "),
    );
  }

  // Confirm NOT platform admin
  const { data: platformAdmin, error: paErr } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", partner.id)
    .maybeSingle();
  if (paErr && !paErr.message.includes("schema cache")) {
    console.warn("platform_admins check:", paErr.message);
  }
  console.log(
    "Platform super admin?",
    platformAdmin ? "YES (unexpected)" : "No (correct)",
  );

  // Confirm no other businesses got private_alpha from this script
  const { data: alphaBiz } = await supabase
    .from("businesses")
    .select("slug, name, private_alpha_enabled, subscription_plan_key")
    .eq("private_alpha_enabled", true);

  console.log("\n=== Verification ===");
  console.log("Private Alpha businesses:", alphaBiz);
  console.log("Stripe subscription on GVM:", updatedBiz.stripe_subscription_id);
  console.log("Plan key (should stay starter/Free):", updatedBiz.subscription_plan_key);
  console.log("\nDone. Partner should sign in as", PARTNER_EMAIL);
  console.log("Dashboard will resolve to", TARGET_SLUG, "via co-owner membership.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
