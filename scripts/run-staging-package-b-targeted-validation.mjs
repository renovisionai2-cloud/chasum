#!/usr/bin/env node
/**
 * Package B targeted Staging validation.
 * Preview producer POST + isolated worker/delivery with stubbed providers.
 * Never targets Production. Never calls processPendingJobs / Cron.
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STAGING_REF = "wnfahklzaxirftyskctd";
const PRODUCTION_REF = "kxcydvhswkuzepwzzinq";
const STAGING_ENV = "/Users/darshan/chasum/.env.staging.local";
const BID = "73c78c46-4b97-4880-82a1-901eff429c47";
const LOC = "a0c7336b-e264-401e-beec-fbaf2152f8f4";
const SVC = "d20718f6-6ee9-47b5-9e2b-a08b7e5eb8a9";
const STAFF = "0ba1ce89-1c3e-4208-afce-0f4b35b5f962";
const MARKER = "chasum-pkgb-publish-20260909";
const DPL = "dpl_4Pa3V1FfC9Kc5pqBzh4GzBS6Z1kg";
const SENTINEL = "<<<HTTPCODE:";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const evidencePath = "/private/tmp/chasum-appt-integrity-918e9cae/pkgb-publish-producer.json";
const reportPath = "/private/tmp/chasum-appt-integrity-918e9cae/pkgb-publish-validation.json";

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

const rest = `${url.replace(/\/$/, "")}/rest/v1`;
const key = staging.SUPABASE_SERVICE_ROLE_KEY;

async function sb(method, pathname, { params, body, prefer } = {}) {
  const target = new URL(rest + pathname);
  if (params) {
    for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
  }
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(target, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

function stateFingerprint(rows) {
  const ordered = [...rows].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const canonical = ordered
    .map((row) =>
      [
        row.id,
        row.business_id ?? "",
        row.job_type,
        row.status,
        String(row.attempts),
        row.scheduled_at ?? "",
        row.next_retry_at ?? "",
        row.cancelled_at ?? "",
        row.started_at ?? "",
        row.completed_at ?? "",
      ].join("|"),
    )
    .join("\n");
  return {
    count: ordered.length,
    idSha256: createHash("sha256").update(ordered.map((row) => row.id).join(",")).digest("hex"),
    stateSha256: createHash("sha256").update(canonical).digest("hex"),
    ids: ordered.map((row) => row.id),
  };
}

async function snapshotJobs() {
  const { status, body } = await sb("GET", "/background_jobs", {
    params: {
      select: "id,business_id,job_type,status,attempts,scheduled_at,next_retry_at,cancelled_at,started_at,completed_at",
      order: "id",
    },
  });
  if (status >= 400 || !Array.isArray(body)) {
    throw new Error(`queue snapshot failed: ${status}`);
  }
  return { rows: body, fingerprint: stateFingerprint(body) };
}

function vercelPost(pathname, payload, rawKey) {
  const result = spawnSync(
    "npx",
    [
      "vercel",
      "curl",
      "--deployment",
      DPL,
      pathname,
      "-s",
      "-X",
      "POST",
      "-H",
      `authorization: Bearer ${rawKey}`,
      "-H",
      "content-type: application/json",
      "-d",
      JSON.stringify(payload),
      "-w",
      `\n${SENTINEL}%{http_code}>>>`,
    ],
    {
      cwd: root,
      encoding: "utf8",
      env: {
        ...process.env,
        NO_UPDATE_NOTIFIER: "1",
      },
    },
  );
  let out = result.stdout ?? "";
  let code = null;
  if (out.includes(SENTINEL)) {
    const idx = out.lastIndexOf(SENTINEL);
    const head = out.slice(0, idx);
    const tail = out.slice(idx + SENTINEL.length);
    code = Number.parseInt(tail.split(">>>")[0], 10);
    out = head.replace(/\n$/, "");
  }
  let parsed = null;
  try {
    parsed = out.trim() ? JSON.parse(out) : null;
  } catch {
    parsed = { _raw: out.slice(0, 500) };
  }
  return { status: code, body: parsed, rc: result.status };
}

function matchesAppointment(job, appointmentId) {
  const payload = job.payload ?? {};
  return (
    payload.appointmentId === appointmentId ||
    payload.data?.appointmentId === appointmentId ||
    payload.chasumPackageBIsolatedMarker === "chasum-pkgb-isolated-20260909"
  );
}

async function cleanup({ keyId, customerId, appointmentId }) {
  const { body: jobs } = await sb("GET", "/background_jobs", {
    params: {
      select: "id,payload,business_id",
      business_id: `eq.${BID}`,
    },
  });
  const mine = Array.isArray(jobs) ? jobs.filter((job) => matchesAppointment(job, appointmentId)) : [];
  const jobIds = mine.map((job) => job.id);
  const intentTokens = new Set(
    mine
      .map((job) => job.payload?.sendIntentId)
      .filter((id) => typeof id === "string"),
  );
  if (appointmentId) intentTokens.add(appointmentId);

  for (const id of jobIds) {
    await sb("DELETE", "/background_jobs", {
      params: { id: `eq.${id}`, business_id: `eq.${BID}` },
    });
  }
  const { body: intents } = await sb("GET", "/communication_send_intents", {
    params: { select: "id,intent_key", business_id: `eq.${BID}` },
  });
  for (const intent of Array.isArray(intents) ? intents : []) {
    const key = String(intent.intent_key ?? "");
    if ([...intentTokens].some((token) => key.includes(token))) {
      await sb("DELETE", "/communication_send_intents", {
        params: { id: `eq.${intent.id}`, business_id: `eq.${BID}` },
      });
    }
  }
  if (appointmentId) {
    await sb("DELETE", "/communications_audit_log", {
      params: { business_id: `eq.${BID}`, entity_id: `eq.${appointmentId}` },
    });
    for (const id of jobIds) {
      await sb("DELETE", "/communications_audit_log", {
        params: { business_id: `eq.${BID}`, entity_id: `eq.${id}` },
      });
    }
    await sb("DELETE", "/appointments", {
      params: { id: `eq.${appointmentId}`, business_id: `eq.${BID}` },
    });
  }
  if (customerId) {
    await sb("DELETE", "/customers", {
      params: { id: `eq.${customerId}`, business_id: `eq.${BID}`, notes: `eq.${MARKER}` },
    });
  }
  if (keyId) {
    await sb("DELETE", "/api_keys", {
      params: { id: `eq.${keyId}`, business_id: `eq.${BID}` },
    });
  }
  const { body: maybeIsolated } = await sb("GET", "/background_jobs", {
    params: { select: "id,payload,business_id", business_id: `eq.${BID}` },
  });
  for (const job of Array.isArray(maybeIsolated) ? maybeIsolated : []) {
    if (job.payload?.chasumPackageBIsolatedMarker === "chasum-pkgb-isolated-20260909") {
      await sb("DELETE", "/background_jobs", {
        params: { id: `eq.${job.id}`, business_id: `eq.${BID}` },
      });
    }
  }
}

const pre = await snapshotJobs();
if (pre.fingerprint.count !== 28) {
  console.error(`HOLD: expected 28 pre-existing jobs, found ${pre.fingerprint.count}`);
  process.exit(2);
}
const pending = pre.rows.filter((row) => row.status === "pending").length;
const completed = pre.rows.filter((row) => row.status === "completed").length;
if (pending !== 20 || completed !== 8) {
  console.error(`HOLD: expected 20 pending / 8 completed, found ${pending} / ${completed}`);
  process.exit(2);
}

const rawKey = `chsm_${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;
const keyHash = createHash("sha256").update(rawKey).digest("hex");
const keyIns = await sb("POST", "/api_keys", {
  prefer: "return=representation",
  body: {
    business_id: BID,
    name: MARKER,
    key_prefix: rawKey.slice(0, 12),
    key_hash: keyHash,
    scopes: ["read", "write"],
  },
});
if (keyIns.status >= 400) {
  console.error("HOLD: api key insert failed", keyIns.status);
  process.exit(2);
}
const keyId = Array.isArray(keyIns.body) ? keyIns.body[0].id : keyIns.body.id;

let customerId = null;
let appointmentId = null;
const report = {
  previewDeployment: DPL,
  pre: {
    count: pre.fingerprint.count,
    pending,
    completed,
    idSha256: pre.fingerprint.idSha256,
    stateSha256: pre.fingerprint.stateSha256,
  },
};

try {
  const custIns = await sb("POST", "/customers", {
    prefer: "return=representation",
    body: {
      business_id: BID,
      name: "Package B Publish",
      email: `${MARKER}@chasum.test.invalid`,
      phone: "5550100888",
      preferred_communication_method: "sms",
      marketing_consent: false,
      marketing_consent_at: null,
      notes: MARKER,
      tags: [MARKER],
    },
  });
  if (custIns.status >= 400) throw new Error(`customer insert ${custIns.status}`);
  const customer = Array.isArray(custIns.body) ? custIns.body[0] : custIns.body;
  customerId = customer.id;
  report.customer = {
    id: customerId,
    preferred: customer.preferred_communication_method,
    marketing_consent: customer.marketing_consent,
    membership_id: customer.membership_id ?? null,
  };

  const start = "2026-10-15T18:00:00.000Z";
  const end = "2026-10-15T18:30:00.000Z";
  const posted = vercelPost(
    "/api/v1/appointments",
    {
      customer_id: customerId,
      service_id: SVC,
      staff_id: STAFF,
      location_id: LOC,
      start_time: start,
      end_time: end,
      notes: MARKER,
    },
    rawKey,
  );
  report.http_status = posted.status;
  const appt = posted.body?.data ?? posted.body;
  if (posted.status !== 201 || !appt?.id) {
    report.post_error = posted.body?.error ?? posted.body;
    throw new Error(`hosted POST ${posted.status}`);
  }
  appointmentId = appt.id;
  report.appointment = {
    id: appointmentId,
    business_id: appt.business_id,
    location_id: appt.location_id,
    business_match: appt.business_id === BID,
    location_match: appt.location_id === LOC,
  };

  const { body: jobs } = await sb("GET", "/background_jobs", {
    params: {
      select: "id,job_type,status,attempts,business_id,scheduled_at,payload",
      business_id: `eq.${BID}`,
    },
  });
  const mine = (jobs ?? []).filter((job) => matchesAppointment(job, appointmentId));
  report.jobs = mine.map((job) => ({
    id: job.id,
    job_type: job.job_type,
    status: job.status,
    attempts: job.attempts,
    scheduled_at: job.scheduled_at,
    templateKey: job.payload?.templateKey ?? null,
    channel: job.payload?.channel ?? null,
    skipPreferenceCheck: job.payload?.skipPreferenceCheck ?? false,
    sendIntentProtocol: job.payload?.sendIntentProtocol ?? null,
    event: job.payload?.event ?? null,
  }));
  fs.mkdirSync(path.dirname(evidencePath), { recursive: true });
  fs.writeFileSync(
    evidencePath,
    JSON.stringify(
      {
        businessId: BID,
        appointmentId,
        customerId,
        jobs: mine.map((job) => ({
          id: job.id,
          job_type: job.job_type,
          status: job.status,
          attempts: job.attempts,
          payload: job.payload ?? {},
        })),
      },
      null,
      2,
    ),
  );

  const env = { ...process.env };
  for (const k of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ACCESS_TOKEN",
    "CHASUM_SUPABASE_TARGET",
  ]) {
    env[k] = staging[k];
  }
  for (const k of [
    "RESEND_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "NEXT_PUBLIC_SUPABASE_URL_PROD",
  ]) {
    delete env[k];
  }
  env.CHASUM_STAGING_PACKAGE_B_ISOLATED = "1";
  env.CHASUM_WORKER_RELIABILITY_ENABLED = "true";
  env.PKGB_PRODUCER_EVIDENCE = evidencePath;
  env.NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  env.EMAIL_FROM = env.EMAIL_FROM || "Chasum <notifications@chasumai.com>";

  const test = spawnSync(
    "npx",
    ["vitest", "run", "tests/integration/staging-package-b-isolated-worker.test.ts"],
    { cwd: root, env, encoding: "utf8", timeout: 180_000 },
  );
  process.stdout.write(test.stdout ?? "");
  process.stderr.write(test.stderr ?? "");
  report.isolated_vitest_status = test.status;
  if (test.status !== 0) throw new Error("isolated vitest failed");
} finally {
  await cleanup({ keyId, customerId, appointmentId });
  const leftoverCustomers = await sb("GET", "/customers", {
    params: { select: "id", notes: `eq.${MARKER}` },
  });
  const leftoverKeys = await sb("GET", "/api_keys", {
    params: { select: "id", name: `eq.${MARKER}` },
  });
  const leftoverAppts = await sb("GET", "/appointments", {
    params: { select: "id", notes: `eq.${MARKER}` },
  });
  const leftoverIsolatedScan = await sb("GET", "/background_jobs", {
    params: { select: "id,payload", business_id: `eq.${BID}` },
  });
  const leftoverIsolated = {
    body: Array.isArray(leftoverIsolatedScan.body)
      ? leftoverIsolatedScan.body.filter(
          (job) => job.payload?.chasumPackageBIsolatedMarker === "chasum-pkgb-isolated-20260909",
        )
      : [],
  };
  const post = await snapshotJobs();
  const preexisting = post.rows.filter((row) => pre.fingerprint.ids.includes(row.id));
  const preexistingFp = stateFingerprint(preexisting);
  report.cleanup = {
    customer_residue: Array.isArray(leftoverCustomers.body) ? leftoverCustomers.body.length : -1,
    api_key_residue: Array.isArray(leftoverKeys.body) ? leftoverKeys.body.length : -1,
    appointment_residue: Array.isArray(leftoverAppts.body) ? leftoverAppts.body.length : -1,
    isolated_job_residue: Array.isArray(leftoverIsolated.body) ? leftoverIsolated.body.length : -1,
    post_count: post.fingerprint.count,
    ids_unchanged: post.fingerprint.idSha256 === pre.fingerprint.idSha256,
    preexisting_state_unchanged: preexistingFp.stateSha256 === pre.fingerprint.stateSha256,
    post_idSha256: post.fingerprint.idSha256,
    post_stateSha256: post.fingerprint.stateSha256,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
}

if (
  report.http_status !== 201 ||
  report.isolated_vitest_status !== 0 ||
  report.cleanup.customer_residue !== 0 ||
  report.cleanup.api_key_residue !== 0 ||
  report.cleanup.appointment_residue !== 0 ||
  report.cleanup.isolated_job_residue !== 0 ||
  report.cleanup.ids_unchanged !== true ||
  report.cleanup.preexisting_state_unchanged !== true
) {
  console.error("PACKAGE B TARGETED VALIDATION FAILED");
  console.error(JSON.stringify(report.cleanup, null, 2));
  process.exit(1);
}

console.log("PACKAGE B TARGETED VALIDATION PASS");
console.log(JSON.stringify({
  http_status: report.http_status,
  jobs: report.jobs,
  cleanup: report.cleanup,
}, null, 2));
process.exit(0);
