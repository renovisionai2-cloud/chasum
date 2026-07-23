/**
 * Verifies production environment variables without printing secrets.
 *
 * Usage:
 *   node scripts/verify-production-env.mjs
 *   node scripts/verify-production-env.mjs --strict
 *
 * --strict treats optional SMS as required and fails if Twilio is missing.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    try {
      const envPath = resolve(process.cwd(), name);
      for (const line of readFileSync(envPath, "utf8").split("\n")) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const [key, ...rest] = line.split("=");
        const k = key.trim();
        if (!process.env[k]) process.env[k] = rest.join("=").trim();
      }
    } catch {
      /* optional file */
    }
  }
}

loadEnv();

const strict = process.argv.includes("--strict");

/** @type {{ key: string; required: boolean; note?: string }[]} */
const checks = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", required: true },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
  { key: "SUPABASE_SERVICE_ROLE_KEY", required: true, note: "Required for cron/jobs" },
  {
    key: "NEXT_PUBLIC_APP_URL",
    required: true,
    note: "Production site URL (https://…)",
  },
  { key: "CRON_SECRET", required: true, note: "Protects /api/cron/process-jobs" },
  {
    key: "RESEND_API_KEY",
    required: true,
    note: "Appointment + reminder emails",
  },
  {
    key: "EMAIL_FROM",
    required: true,
    note: "Verified Resend from address",
  },
  {
    key: "SUPABASE_ACCESS_TOKEN",
    required: false,
    note: "Only for scripts/sync-supabase-email-templates.mjs",
  },
  { key: "TWILIO_ACCOUNT_SID", required: strict },
  { key: "TWILIO_AUTH_TOKEN", required: strict },
  { key: "TWILIO_PHONE_NUMBER", required: strict },
  { key: "GOOGLE_CLIENT_ID", required: false },
  { key: "GOOGLE_CLIENT_SECRET", required: false },
  { key: "MICROSOFT_CLIENT_ID", required: false },
  { key: "MICROSOFT_CLIENT_SECRET", required: false },
];

let failed = 0;

console.log("Chasum production environment check\n");

for (const { key, required, note } of checks) {
  const value = process.env[key];
  const present = Boolean(value && value.length > 0 && !value.startsWith("your-"));
  const label = present ? "OK" : required ? "MISSING" : "optional";
  if (!present && required) failed += 1;
  const hint = note ? ` — ${note}` : "";
  console.log(`[${label}] ${key}${hint}`);

  if (key === "NEXT_PUBLIC_SUPABASE_URL" && present && /\/(rest|auth)\/v1\/?$/i.test(value)) {
    failed += 1;
    console.log(
      `  ↳ INVALID: must be project origin only (https://xxxx.supabase.co), not ${value}`,
    );
  }
}

console.log("");
if (failed > 0) {
  console.error(`Failed: ${failed} required variable(s) missing or still placeholder.`);
  process.exit(1);
}

console.log("All required production environment variables are set.");
console.log("Next: configure Supabase Auth SMTP (Resend) and run migrations 001–013.");
