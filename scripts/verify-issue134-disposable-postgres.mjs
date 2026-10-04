import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const databaseUrl = process.env.ISSUE134_DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing ISSUE134_DATABASE_URL.");
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
      new Set(["localhost", "127.0.0.1", "::1"]).has(normalizedHostname(url)) &&
      url.search === "" &&
      url.hash === "" &&
      !value.includes("?") &&
      !value.includes("#")
    );
  } catch {
    return false;
  }
}

for (const allowed of [
  "postgresql://local@localhost/db",
  "postgresql://local@127.0.0.1/db",
  "postgresql://local@[::1]/db",
]) {
  if (!isLocalPostgresUrl(allowed)) {
    console.error(`Local-host guard rejected an allowed test URL: ${allowed}`);
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
    console.error(`Local-host guard accepted a forbidden test URL: ${refused}`);
    process.exit(1);
  }
}

if (!isLocalPostgresUrl(databaseUrl)) {
  let host = "invalid";
  try {
    host = normalizedHostname(new URL(databaseUrl));
  } catch {
    // Keep the redacted "invalid" classification.
  }
  console.error(
    `Refusing database URL with authority host "${host}". Issue #134 verification permits PostgreSQL on localhost, 127.0.0.1, or ::1 only and forbids query strings and fragments.`,
  );
  process.exit(1);
}

const parsed = new URL(databaseUrl);
const host = normalizedHostname(parsed);
const psql = existsSync("/opt/homebrew/bin/psql")
  ? "/opt/homebrew/bin/psql"
  : "psql";
const fixture = resolve(
  process.cwd(),
  "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql",
);
const migration = resolve(
  process.cwd(),
  "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
);
const contract = resolve(
  process.cwd(),
  "tests/postgres/issue-134-payment-attempt-foundation-contract.sql",
);

function run(args, { print = true } = {}) {
  const result = spawnSync(psql, args, {
    encoding: "utf8",
    stdio: "pipe",
  });
  if (print) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    if (!print) {
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
    }
    process.exit(result.status ?? 1);
  }
  return result;
}

function runAsync(sql) {
  return new Promise((resolvePromise) => {
    const child = spawn(
      psql,
      [databaseUrl, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql],
      { stdio: ["ignore", "pipe", "pipe"] },
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
      resolvePromise({ status: 1, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (status) => {
      resolvePromise({ status: status ?? 1, stdout, stderr });
    });
  });
}

const redactedPort = parsed.port || "5432";
const redactedDatabase = parsed.pathname.replace(/^\//, "") || "postgres";
console.log(
  `Issue #134 disposable target: postgresql://${host}:${redactedPort}/${redactedDatabase} (credentials redacted)`,
);
console.log(
  "PASS 18 local-host allowlist and non-local/query/fragment refusal self-tests (4 endpoint-override cases)",
);
run(["--version"]);

const apply = run([
  databaseUrl,
  "-X",
  "-v",
  "ON_ERROR_STOP=1",
  "-f",
  fixture,
  "-f",
  migration,
  "-f",
  contract,
]);
if (
  /warning:.*(?:lock_timeout|statement_timeout)|SET LOCAL can only be used/i.test(
    apply.stderr ?? "",
  )
) {
  console.error("Timeout-related warning detected during migration apply.");
  process.exit(1);
}
console.log("PASS 19 migration apply emitted no timeout-related warning");

const concurrencyAttempt = "13400000-0000-0000-0000-000000000901";
run(
  [
    databaseUrl,
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `
      insert into public.businesses(id, name)
      values ('13400000-0000-0000-0000-000000000801', 'Concurrency Business');
      insert into public.customers(id, business_id, name)
      values (
        '13400000-0000-0000-0000-000000000811',
        '13400000-0000-0000-0000-000000000801',
        'Concurrency Customer'
      );
      insert into public.commerce_payment_attempts(
        id, business_id, attempt_key, request_fingerprint, source, customer_id,
        payment_kind, amount_cents, currency, method, provider_route,
        execution_state
      ) values (
        '${concurrencyAttempt}',
        '13400000-0000-0000-0000-000000000801',
        '13400000-0000-0000-0000-000000000902',
        'v1:' || repeat('9', 64),
        'collect_payment',
        '13400000-0000-0000-0000-000000000811',
        'payment', 9191, 'cad', 'cash', 'manual', 'ACCEPTED'
      );
    `,
  ],
  { print: false },
);

const concurrentInsert = `
  set role service_role;
  insert into public.commerce_transactions(
    business_id, customer_id, kind, status, method, amount_cents, currency,
    provider, payment_attempt_id
  ) values (
    '13400000-0000-0000-0000-000000000801',
    '13400000-0000-0000-0000-000000000811',
    'payment', 'succeeded', 'cash', 9191, 'cad', 'manual',
    '${concurrencyAttempt}'
  );
`;
const race = await Promise.all([
  runAsync(concurrentInsert),
  runAsync(concurrentInsert),
]);
const winners = race.filter((result) => result.status === 0);
const losers = race.filter((result) => result.status !== 0);
if (
  winners.length !== 1 ||
  losers.length !== 1 ||
  !losers[0].stderr.includes("commerce_transactions_payment_attempt_key")
) {
  console.error("Expected exactly one concurrent ledger-link winner.");
  console.error(
    JSON.stringify(
      race.map(({ status, stderr }) => ({ status, stderr })),
      null,
      2,
    ),
  );
  process.exit(1);
}

const linkedCount = run(
  [
    databaseUrl,
    "-X",
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `select count(*) from public.commerce_transactions where payment_attempt_id = '${concurrencyAttempt}';`,
  ],
  { print: false },
).stdout.trim();
if (linkedCount !== "1") {
  console.error(`Expected one linked concurrency row, found ${linkedCount}.`);
  process.exit(1);
}

console.log("PASS 20 concurrent same-attempt ledger link has exactly one winner");
console.log("Issue #134 disposable PostgreSQL execution contract passed.");
