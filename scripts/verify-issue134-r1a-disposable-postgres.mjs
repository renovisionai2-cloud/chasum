import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const databaseUrl = process.env.ISSUE134_R1A_DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing ISSUE134_R1A_DATABASE_URL.");
  process.exit(1);
}

function normalizedHostname(url) {
  return url.hostname.replace(/^\[(.*)\]$/, "$1");
}

function isLocalPostgresUrl(value) {
  try {
    const url = new URL(value);
    return (
      new Set(["postgres:", "postgresql:"]).has(url.protocol) &&
      new Set(["localhost", "127.0.0.1", "::1"]).has(
        normalizedHostname(url),
      ) &&
      url.search === "" &&
      url.hash === "" &&
      !value.includes("?") &&
      !value.includes("#")
    );
  } catch {
    return false;
  }
}

function createPsqlChildEnv(parentEnv = process.env) {
  const childEnv = {};
  for (const [key, value] of Object.entries(parentEnv)) {
    if (/^PG/i.test(key) || value === undefined) continue;
    childEnv[key] = value;
  }
  return childEnv;
}

const poisonedPsqlVariables = {
  PGHOSTADDR: "203.0.113.1",
  PGHOST: "evil.example.com",
  PGSERVICE: "evil",
  PGSERVICEFILE: "/tmp/evil",
  PGPORT: "9999",
  PGDATABASE: "evil",
  PGUSER: "evil",
  PGOPTIONS: "-c search_path=evil",
  PGPASSFILE: "/tmp/evil-passfile",
  PGSYSCONFDIR: "/tmp/evil-system-config",
  PGFUTURE_CONNECTION_OVERRIDE: "evil",
};
const sanitizedPoisonedEnv = createPsqlChildEnv({
  ...process.env,
  ...poisonedPsqlVariables,
  ISSUE134_R1A_ENVIRONMENT_SENTINEL: "preserved",
});
if (
  Object.keys(sanitizedPoisonedEnv).some((key) => /^PG/i.test(key)) ||
  sanitizedPoisonedEnv.ISSUE134_R1A_ENVIRONMENT_SENTINEL !== "preserved" ||
  sanitizedPoisonedEnv.PATH !== process.env.PATH
) {
  console.error("R1a verifier environment sanitization self-test failed.");
  process.exit(1);
}

for (const allowed of [
  "postgresql://local@localhost/db",
  "postgresql://local@127.0.0.1/db",
  "postgresql://local@[::1]/db",
]) {
  if (!isLocalPostgresUrl(allowed)) {
    console.error(`Local-host guard rejected allowed URL: ${allowed}`);
    process.exit(1);
  }
}
for (const refused of [
  "postgresql://local@example.com/db",
  "postgresql://local@localhost.example.com/db",
  "https://localhost/db",
  "postgresql://local@127.0.0.1/db?host=evil.example.com",
  "postgresql://local@127.0.0.1/db?hostaddr=203.0.113.1",
  "postgresql://local@localhost/db?service=evil",
  "postgresql://local@localhost/db#anything",
]) {
  if (isLocalPostgresUrl(refused)) {
    console.error(`Local-host guard accepted forbidden URL: ${refused}`);
    process.exit(1);
  }
}

if (!isLocalPostgresUrl(databaseUrl)) {
  let host = "invalid";
  try {
    host = normalizedHostname(new URL(databaseUrl));
  } catch {
    // Keep errors redacted.
  }
  console.error(
    `Refusing database URL with authority host "${host}". R1a verification permits PostgreSQL on localhost, 127.0.0.1, or ::1 only and forbids query strings and fragments.`,
  );
  process.exit(1);
}

const psql = existsSync("/opt/homebrew/bin/psql")
  ? "/opt/homebrew/bin/psql"
  : "psql";
const psqlEnv = createPsqlChildEnv();
const root = process.cwd();
const files = [
  "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql",
  "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
  "tests/postgres/issue-134-r1a-manual-kernel-fixture.sql",
  "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql",
  "tests/postgres/issue-134-r1a-manual-kernel-contract.sql",
].map((path) => resolve(root, path));

function run(args, { print = true } = {}) {
  const result = spawnSync(psql, args, {
    encoding: "utf8",
    stdio: "pipe",
    env: psqlEnv,
  });
  if (print) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  if (result.error || result.status !== 0) {
    if (!print) {
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
    }
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
  return result;
}

function runAsync(sql) {
  return new Promise((complete) => {
    const child = spawn(
      psql,
      [databaseUrl, "-X", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql],
      { stdio: ["ignore", "pipe", "pipe"], env: psqlEnv },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      complete({ status: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (status) => {
      complete({ status: status ?? 1, stdout, stderr });
    });
  });
}

const parsed = new URL(databaseUrl);
console.log(
  `Issue #134 R1a disposable target: postgresql://${normalizedHostname(parsed)}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "") || "postgres"} (credentials redacted)`,
);
console.log(
  "PASS local-host/query/fragment refusal and complete PG* child-environment sanitization self-tests",
);
run(["--version"]);

const applyArgs = [databaseUrl, "-X", "-v", "ON_ERROR_STOP=1"];
for (const file of files) applyArgs.push("-f", file);
const apply = run(applyArgs);
if (
  /warning:.*(?:lock_timeout|statement_timeout)|SET LOCAL can only be used/i.test(
    apply.stderr ?? "",
  )
) {
  console.error("Timeout-related warning detected during R1a migration apply.");
  process.exit(1);
}
console.log("PASS R1a full SQL executed with no timeout warning");

run(
  [
    databaseUrl,
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `
      insert into public.businesses(id, name, currency)
      values ('13410000-0000-4000-8000-000000000801', 'R1a Concurrency', 'cad');
      insert into public.customers(id, business_id, name)
      values (
        '13410000-0000-4000-8000-000000000811',
        '13410000-0000-4000-8000-000000000801',
        'R1a Concurrent Customer'
      );
      insert into public.appointments(id, business_id, customer_id)
      values (
        '13410000-0000-4000-8000-000000000821',
        '13410000-0000-4000-8000-000000000801',
        '13410000-0000-4000-8000-000000000811'
      );
    `,
  ],
  { print: false },
);

const sameKeyAdmission = `
  set role service_role;
  select outcome, attempt_id
  from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000801',
    '13410000-0000-4000-8000-000000000901',
    'v1:' || repeat('9', 64),
    'collect_payment',
    '13410000-0000-4000-8000-000000000811',
    '13410000-0000-4000-8000-000000000821',
    '13410000-0000-4000-8000-000000000001',
    'payment', 6100, 'cad', 'cash', 'manual'
  );
`;
const admissionRace = await Promise.all([
  runAsync(sameKeyAdmission),
  runAsync(sameKeyAdmission),
]);
if (admissionRace.some(({ status }) => status !== 0)) {
  console.error("Concurrent same-key admission returned an infrastructure error.");
  console.error(JSON.stringify(admissionRace, null, 2));
  process.exit(1);
}
const admissionOutcomes = admissionRace
  .map(({ stdout }) => stdout.trim().split("\n").at(-1).split("|")[0])
  .sort();
if (
  JSON.stringify(admissionOutcomes) !==
  JSON.stringify(["ADMITTED", "EXISTING"])
) {
  console.error(`Unexpected admission race outcomes: ${admissionOutcomes}`);
  process.exit(1);
}

const attemptId = run(
  [
    databaseUrl,
    "-X",
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `select id from public.commerce_payment_attempts
     where business_id = '13410000-0000-4000-8000-000000000801'
       and attempt_key = '13410000-0000-4000-8000-000000000901';`,
  ],
  { print: false },
).stdout.trim();

run(
  [
    databaseUrl,
    "-X",
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `set role service_role;
     select outcome from public.commit_manual_payment_attempt_v1(
       '13410000-0000-4000-8000-000000000801',
       '${attemptId}'
     );`,
  ],
  { print: false },
);

const conflictSql = `
  set role service_role;
  select outcome, conflict_event_id
  from public.admit_payment_attempt_v1(
    '13410000-0000-4000-8000-000000000801',
    '13410000-0000-4000-8000-000000000901',
    'v1:' || repeat('9', 64),
    'payments_dashboard',
    '13410000-0000-4000-8000-000000000811',
    '13410000-0000-4000-8000-000000000821',
    '13410000-0000-4000-8000-000000000002',
    'payment', 6200, 'cad', 'cash', 'manual'
  );
`;
const conflictRace = await Promise.all([
  runAsync(conflictSql),
  runAsync(conflictSql),
]);
if (
  conflictRace.some(({ status, stdout }) => {
    return (
      status !== 0 ||
      !stdout.trim().split("\n").at(-1).startsWith("KEY_CONFLICT|")
    );
  })
) {
  console.error("Concurrent committed conflict did not return two logical conflicts.");
  console.error(JSON.stringify(conflictRace, null, 2));
  process.exit(1);
}
const conflictIds = conflictRace.map(
  ({ stdout }) => stdout.trim().split("\n").at(-1).split("|")[1],
);
if (!conflictIds[0] || conflictIds[0] !== conflictIds[1]) {
  console.error("Concurrent conflict evidence identities were not stable.");
  process.exit(1);
}

const counts = run(
  [
    databaseUrl,
    "-X",
    "-At",
    "-F",
    "|",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `select
       (select count(*) from public.commerce_payment_attempts
        where business_id = '13410000-0000-4000-8000-000000000801'
          and attempt_key = '13410000-0000-4000-8000-000000000901'),
       (select count(*) from public.commerce_payment_attempt_events
        where attempt_id = '${attemptId}' and event_type = 'REQUESTED'),
       (select count(*) from public.commerce_payment_attempt_events
        where attempt_id = '${attemptId}' and event_type = 'KEY_CONFLICT'),
       (select count(*) from public.commerce_transactions
        where payment_attempt_id = '${attemptId}');`,
  ],
  { print: false },
).stdout.trim();
if (counts !== "1|1|1|1") {
  console.error(`Unexpected concurrency result counts: ${counts}`);
  process.exit(1);
}

console.log(
  "PASS concurrent same-key admission has one winner/one REQUESTED; committed conflict race returns one stable evidence row",
);
console.log("Issue #134 R1a disposable PostgreSQL contract passed.");
