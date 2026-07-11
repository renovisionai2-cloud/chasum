/**
 * Syncs Supabase Auth email templates for SSR token-hash flows.
 *
 * Requires SUPABASE_ACCESS_TOKEN (personal access token from supabase.com/dashboard/account/tokens)
 * and NEXT_PUBLIC_SUPABASE_URL (to derive project ref).
 *
 * Usage: node scripts/sync-supabase-email-templates.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const [key, ...rest] = line.split("=");
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  } catch {
    // .env.local is optional if vars are already exported
  }
}

loadEnv();

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

if (!accessToken) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN. Create one at https://supabase.com/dashboard/account/tokens",
  );
  process.exit(1);
}

if (!supabaseUrl) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

const confirmationContent = `<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/dashboard">Confirm your email</a></p>`;

const recoveryContent = `<h2>Reset your password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password">Reset password</a></p>`;

const response = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_url: appUrl,
      mailer_subjects_confirmation: "Confirm your signup",
      mailer_templates_confirmation_content: confirmationContent,
      mailer_subjects_recovery: "Reset your password",
      mailer_templates_recovery_content: recoveryContent,
    }),
  },
);

if (!response.ok) {
  console.error("Failed to update email templates:", await response.text());
  process.exit(1);
}

console.log("Supabase email templates updated for SSR token-hash callback flow.");
