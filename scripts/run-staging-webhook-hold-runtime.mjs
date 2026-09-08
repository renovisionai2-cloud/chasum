#!/usr/bin/env node
/**
 * Local-only Staging proof of CHASUM_WORKER_WEBHOOKS_ENABLED default-off.
 * Refuses Production. Never calls processPendingJobs.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STAGING_REF = "wnfahklzaxirftyskctd";
const PRODUCTION_REF = "kxcydvhswkuzepwzzinq";
const STAGING_ENV = "/Users/darshan/chasum/.env.staging.local";
const MARKER = "chasum-isolated-staging-webhook-hold-20260908";
const TEMPLATE = "chasum.isolated.webhook.hold";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseEnv(filePath) {
  const parsed = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index);
    let value = trimmed.slice(index + 1);
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function refFromUrl(url) {
  return String(url ?? "").match(/^https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] ?? null;
}

if (!fs.existsSync(STAGING_ENV)) {
  console.error("HOLD: Staging env file is missing");
  process.exit(2);
}

const staging = parseEnv(STAGING_ENV);
const ref = refFromUrl(staging.NEXT_PUBLIC_SUPABASE_URL);
if (ref !== STAGING_REF) {
  console.error(`HOLD: Staging env URL ref is ${ref ?? "none"}`);
  process.exit(2);
}
if (Object.values(staging).some((value) => String(value).includes(PRODUCTION_REF))) {
  console.error("HOLD: Production ref present in Staging env");
  process.exit(2);
}
if (staging.CHASUM_SUPABASE_TARGET !== "staging") {
  console.error("HOLD: CHASUM_SUPABASE_TARGET is not staging");
  process.exit(2);
}

const env = { ...process.env };
for (const key of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
  "CHASUM_SUPABASE_TARGET",
]) {
  env[key] = staging[key];
}
for (const key of [
  "RESEND_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "NEXT_PUBLIC_SUPABASE_URL_PROD",
]) {
  delete env[key];
}
env.CHASUM_RUN_STAGING_WEBHOOK_HOLD_TEST = "1";
env.CHASUM_WORKER_RELIABILITY_ENABLED = "true";
env.CHASUM_WORKER_WEBHOOKS_ENABLED = "false";
env.NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function run(command, args, extra = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    encoding: "utf8",
    ...extra,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  return result;
}

console.log("=== Staging webhook-hold identity ===");
console.log(JSON.stringify({
  supabaseRef: ref,
  reliability: env.CHASUM_WORKER_RELIABILITY_ENABLED,
  webhooksEnabled: env.CHASUM_WORKER_WEBHOOKS_ENABLED,
  providerKeysPresent: Boolean(env.RESEND_API_KEY || env.TWILIO_ACCOUNT_SID),
}));

const test = run("npx", [
  "vitest",
  "run",
  "tests/integration/staging-webhook-hold-runtime.test.ts",
], { timeout: 120_000 });

const cleanupSql = `
delete from public.communication_send_intents
where template_key = '${TEMPLATE}';
delete from public.background_jobs
where coalesce(payload->>'chasumIsolatedRuntimeMarker','') = '${MARKER}';
select json_build_object(
  'pending', (select count(*) from public.background_jobs where status = 'pending'),
  'synthetic_jobs_left', (
    select count(*) from public.background_jobs
    where coalesce(payload->>'chasumIsolatedRuntimeMarker','') = '${MARKER}'
  )
);
`;
const cleanup = run("npx", [
  "--yes",
  "supabase@2.117.0",
  "db",
  "query",
  "--linked",
  "--project-ref",
  STAGING_REF,
  cleanupSql,
], { timeout: 120_000 });

if (test.status !== 0) process.exit(test.status ?? 1);
if (cleanup.status !== 0) process.exit(cleanup.status ?? 1);
process.exit(0);
