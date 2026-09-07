#!/usr/bin/env node
/**
 * Local-only Staging isolated worker runtime harness.
 * Loads Staging env, refuses Production, stubs providers via the gated vitest file,
 * and never starts the global worker / processPendingJobs queue scan.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STAGING_REF = "wnfahklzaxirftyskctd";
const PRODUCTION_REF = "kxcydvhswkuzepwzzinq";
const STAGING_ENV = "/Users/darshan/chasum/.env.staging.local";
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
const url = staging.NEXT_PUBLIC_SUPABASE_URL;
const ref = refFromUrl(url);
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
env.CHASUM_RUN_STAGING_ISOLATED_WORKER_TEST = "1";
env.CHASUM_WORKER_RELIABILITY_ENABLED = "true";
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

const identitySql = `
select json_build_object(
  'project_ok', current_database() is not null,
  'send_intents_exists', to_regclass('public.communication_send_intents') is not null,
  'force_rls', (
    select relforcerowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'communication_send_intents'
  ),
  'rls', (
    select relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'communication_send_intents'
  ),
  'policy_count', (
    select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'communication_send_intents'
  ),
  'grants', (
    select json_agg(json_build_object('grantee', grantee, 'privilege', privilege_type) order by grantee, privilege_type)
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'communication_send_intents'
  ),
  'applied_send_intent', exists (
    select 1 from supabase_migrations.schema_migrations where version = '20260905024239'
  ),
  'applied_034_036', (
    select coalesce(json_agg(version order by version), '[]'::json)
    from supabase_migrations.schema_migrations
    where version in (
      '034_optional_appointment_staff',
      '035_booking_interval_allowed_values',
      '036_booking_resources'
    )
    or version like '034%'
    or version like '035%'
    or version like '036%'
  ),
  'pending_unmarked', (
    select count(*) from public.background_jobs
    where status = 'pending'
      and coalesce(payload->>'chasumIsolatedRuntimeMarker','') <> 'chasum-isolated-staging-runtime-20260907'
  ),
  'processing', (
    select count(*) from public.background_jobs where status = 'processing'
  )
);
`;

console.log("=== PHASE 1 identity / schema ===");
const identity = run("npx", [
  "--yes",
  "supabase@2.117.0",
  "db",
  "query",
  "--linked",
  "--project-ref",
  STAGING_REF,
  identitySql,
], { timeout: 120_000 });
if (identity.status !== 0) {
  console.error("HOLD: Staging identity query failed");
  process.exit(identity.status ?? 2);
}

console.log("=== PHASE 3-6 isolated application vitest ===");
const test = run("npx", [
  "vitest",
  "run",
  "tests/integration/staging-isolated-worker-runtime.test.ts",
], { timeout: 180_000 });

console.log("=== PHASE 5 CLI synthetic intent/job residue sweep ===");
const cleanupSql = `
delete from public.communication_send_intents
where template_key = 'chasum.isolated.runtime';
delete from public.background_jobs
where coalesce(payload->>'chasumIsolatedRuntimeMarker','') = 'chasum-isolated-staging-runtime-20260907';
select json_build_object(
  'pending_unmarked', (
    select count(*) from public.background_jobs
    where status = 'pending'
      and coalesce(payload->>'chasumIsolatedRuntimeMarker','') <> 'chasum-isolated-staging-runtime-20260907'
  ),
  'processing', (select count(*) from public.background_jobs where status = 'processing'),
  'synthetic_jobs_left', (
    select count(*) from public.background_jobs
    where coalesce(payload->>'chasumIsolatedRuntimeMarker','') = 'chasum-isolated-staging-runtime-20260907'
  ),
  'synthetic_intents_left', (
    select count(*) from public.communication_send_intents
    where template_key = 'chasum.isolated.runtime'
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
