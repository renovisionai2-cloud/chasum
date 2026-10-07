import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { tmpdir, userInfo } from "node:os";
import { join, resolve } from "node:path";

const pgBin = "/opt/homebrew/opt/postgresql@17/bin";
const binaries = {
  initdb: join(pgBin, "initdb"),
  pgCtl: join(pgBin, "pg_ctl"),
  createdb: join(pgBin, "createdb"),
  psql: join(pgBin, "psql"),
};
for (const [name, path] of Object.entries(binaries)) {
  if (!existsSync(path)) {
    throw new Error(`PostgreSQL 17 ${name} binary is unavailable at ${path}`);
  }
}

const root = process.cwd();
const evidenceDir = mkdtempSync(
  join(tmpdir(), "chasum-issue134-attribution-evidence-"),
);
const privateHome = join(evidenceDir, "home");
const privatePgpass = join(privateHome, ".pgpass");
const privateServiceFile = join(privateHome, "pg_service.conf");
const dataDir = join(evidenceDir, "pgdata");
const serverLog = join(evidenceDir, "postgres.log");
const summaryPath = join(evidenceDir, "summary.json");
const phaseLogPath = join(evidenceDir, "phases.jsonl");
const sqlStdoutPath = join(evidenceDir, "sql.stdout.log");
const sqlStderrPath = join(evidenceDir, "sql.stderr.log");
const sourceIdentityBeforePath = join(evidenceDir, "source-identity-before.json");
const sourceIdentityAfterPath = join(evidenceDir, "source-identity-after.json");
const ownershipMarkerPath = join(evidenceDir, "ownership-marker");
const markerPath = join(dataDir, ".chasum-issue134-disposable");
const marker = `issue134-attribution-${randomBytes(16).toString("hex")}`;
const user = userInfo().username;
mkdirSync(privateHome, { mode: 0o700 });
writeFileSync(privatePgpass, "", { flag: "wx", mode: 0o600 });
writeFileSync(privateServiceFile, "", { flag: "wx", mode: 0o600 });
writeFileSync(phaseLogPath, "", { flag: "wx", mode: 0o600 });
writeFileSync(sqlStdoutPath, "", { flag: "wx", mode: 0o600 });
writeFileSync(sqlStderrPath, "", { flag: "wx", mode: 0o600 });

function createChildEnv(parent = process.env) {
  const child = {
    PATH: `${pgBin}:/usr/bin:/bin`,
    HOME: privateHome,
    USER: user,
    LOGNAME: user,
    PGPASSFILE: privatePgpass,
    PGSERVICEFILE: privateServiceFile,
    PGSYSCONFDIR: privateHome,
  };
  for (const key of ["LANG", "LC_ALL", "LC_CTYPE", "TZ", "TMPDIR"]) {
    if (parent[key] !== undefined) child[key] = parent[key];
  }
  return child;
}

const poisoned = createChildEnv({
  ...process.env,
  PGHOST: "forbidden.example",
  PGHOSTADDR: "203.0.113.1",
  PGPORT: "1",
  PGDATABASE: "forbidden",
  PGUSER: "forbidden",
  PGSERVICE: "forbidden",
  PGOPTIONS: "-c search_path=forbidden",
  NODE_OPTIONS: "--require=/tmp/forbidden",
  DYLD_INSERT_LIBRARIES: "/tmp/forbidden.dylib",
  STRIPE_SECRET_KEY: "forbidden",
});
if (
  poisoned.PGPASSFILE !== privatePgpass ||
  poisoned.PGSERVICEFILE !== privateServiceFile ||
  poisoned.PGSYSCONFDIR !== privateHome ||
  [
    "PGHOST",
    "PGHOSTADDR",
    "PGPORT",
    "PGDATABASE",
    "PGUSER",
    "PGSERVICE",
    "PGOPTIONS",
    "NODE_OPTIONS",
    "DYLD_INSERT_LIBRARIES",
    "STRIPE_SECRET_KEY",
  ].some((key) => Object.hasOwn(poisoned, key))
) {
  throw new Error("Minimal PostgreSQL child environment self-test failed");
}
const childEnv = createChildEnv();
const sourcePaths = [
  "scripts/verify-issue134-appointment-financial-attribution-postgres.mjs",
  "tests/postgres/issue-134-appointment-financial-attribution-contract.sql",
  "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql",
  "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql",
  "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
  "tests/postgres/issue-134-r1a-manual-kernel-fixture.sql",
  "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql",
  "tests/postgres/issue-134-r1a-manual-kernel-contract.sql",
];

let port;
let startAttempted = false;
let passed = false;
let originalFailure = null;
let sourceIdentityBefore = null;
const evidence = {
  marker,
  evidenceDir,
  serverLog,
  phaseLog: phaseLogPath,
  sqlStdoutLog: sqlStdoutPath,
  sqlStderrLog: sqlStderrPath,
  sourceIdentityBeforeFile: sourceIdentityBeforePath,
  sourceIdentityAfterFile: sourceIdentityAfterPath,
  sourceIdentityBefore: null,
  sourceIdentityAfter: null,
  sourceIdentityMatched: null,
  sourceIdentityFailure: null,
  dataDirectory: null,
  postgresVersion: null,
  boundedFixture: null,
  migrationElapsedMs: null,
  lockTimeoutElapsedMs: null,
  concurrency: [],
  passed: false,
  originalFailure: null,
  cleanupFailure: null,
  stopConfirmed: null,
  pgdataRemoved: false,
};

function failureSummary(error) {
  return {
    name: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
  };
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
}

function captureSourceIdentity() {
  const head = spawnSync("/usr/bin/git", ["rev-parse", "--verify", "HEAD"], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
    env: childEnv,
  });
  const repositoryHead = head.stdout?.trim();
  if (
    head.error ||
    head.status !== 0 ||
    !repositoryHead ||
    !/^[0-9a-f]{40}$/.test(repositoryHead)
  ) {
    throw head.error ?? new Error(
      `Could not record repository HEAD: ${head.stderr ?? ""}`,
    );
  }
  return {
    repositoryHead,
    files: Object.fromEntries(
      sourcePaths.map((path) => [path, sha256File(path)]),
    ),
  };
}

let phaseSequence = 0;
function recordPhase(phase, status, error, stdout = "", stderr = "", sqlPhase = false) {
  phaseSequence += 1;
  appendFileSync(
    phaseLogPath,
    `${JSON.stringify({
      sequence: phaseSequence,
      phase,
      status,
      error: error ? failureSummary(error) : null,
    })}\n`,
  );
  if (!sqlPhase) return;
  const header = `\n=== phase=${phase} status=${status ?? "null"} ===\n`;
  appendFileSync(sqlStdoutPath, `${header}${stdout}`);
  appendFileSync(sqlStderrPath, `${header}${stderr}`);
}

function command(path, args, options = {}) {
  const {
    quiet = false,
    phase = path === binaries.psql ? "psql" : "command",
    ...spawnOptions
  } = options;
  const result = spawnSync(path, args, {
    encoding: "utf8",
    stdio: "pipe",
    env: childEnv,
    ...spawnOptions,
  });
  recordPhase(
    phase,
    result.status,
    result.error,
    result.stdout ?? "",
    result.stderr ?? "",
    path === binaries.psql,
  );
  if (!quiet) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  if (result.error || result.status !== 0) {
    if (quiet) {
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
    }
    throw result.error ?? new Error(
      `${path} exited ${result.status}: ${result.stderr ?? ""}`,
    );
  }
  return result;
}

function psqlArgs(database, extra = []) {
  return [
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-U",
    user,
    "-d",
    database,
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    ...extra,
  ];
}

function sql(database, statement, options = {}) {
  return command(
    binaries.psql,
    psqlArgs(database, ["-At", "-F", "|", "-c", statement]),
    { ...options, phase: options.phase ?? `sql:${database}` },
  ).stdout.trim();
}

function file(database, path, options = {}) {
  return command(
    binaries.psql,
    psqlArgs(database, ["-f", resolve(root, path)]),
    { ...options, phase: options.phase ?? `file:${path}` },
  );
}

function files(database, paths, options = {}) {
  return command(
    binaries.psql,
    psqlArgs(
      database,
      paths.flatMap((path) => ["-f", resolve(root, path)]),
    ),
    {
      ...options,
      phase: options.phase ?? `files:${paths.join(",")}`,
    },
  );
}

function sqlAsync(database, statement, phase) {
  return new Promise((complete) => {
    const child = spawn(
      binaries.psql,
      psqlArgs(database, ["-At", "-F", "|", "-c", statement]),
      { stdio: ["ignore", "pipe", "pipe"], env: childEnv },
    );
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      recordPhase(
        phase,
        result.status,
        result.error,
        result.stdout,
        result.stderr,
        true,
      );
      complete(result);
    };
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      finish({
        status: 1,
        error,
        stdout,
        stderr: `${stderr}${error.message}`,
      });
    });
    child.on("close", (status) => {
      finish({ status: status ?? 1, error: null, stdout, stderr });
    });
  });
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForActivity(applicationName, predicate, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = sql(
      "postgres",
      `select coalesce(state, ''), coalesce(wait_event_type, ''), coalesce(wait_event, '')
       from pg_catalog.pg_stat_activity
       where application_name = '${applicationName}'
       order by backend_start desc
       limit 1`,
      { quiet: true },
    );
    if (row && predicate(row.split("|"))) return row;
    sleep(40);
  }
  throw new Error(`Timed out waiting for activity ${applicationName}`);
}

async function availableLoopbackPort() {
  return await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Could not allocate a loopback port"));
        return;
      }
      const selected = address.port;
      server.close(() => resolvePort(selected));
    });
  });
}

function loadAcceptedBaseline(database) {
  for (const path of [
    "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql",
    "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
    "tests/postgres/issue-134-r1a-manual-kernel-fixture.sql",
    "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql",
  ]) {
    file(database, path, { quiet: true });
  }
}

function digest(database) {
  return sql(
    database,
    `select pg_catalog.md5(pg_catalog.concat_ws('|',
       (select pg_catalog.md5(coalesce(pg_catalog.string_agg(row_to_json(t)::text, '|' order by id), '')) from public.businesses t),
       (select pg_catalog.md5(coalesce(pg_catalog.string_agg(row_to_json(t)::text, '|' order by id), '')) from public.customers t),
       (select pg_catalog.md5(coalesce(pg_catalog.string_agg(row_to_json(t)::text, '|' order by id), '')) from public.appointments t),
       (select pg_catalog.md5(coalesce(pg_catalog.string_agg(row_to_json(t)::text, '|' order by id), '')) from public.commerce_transactions t),
       (select pg_catalog.md5(coalesce(pg_catalog.string_agg(row_to_json(t)::text, '|' order by id), '')) from public.commerce_payment_attempts t),
       (select pg_catalog.md5(coalesce(pg_catalog.string_agg(row_to_json(t)::text, '|' order by event_sequence), '')) from public.commerce_payment_attempt_events t),
       (select pg_catalog.md5(coalesce(pg_catalog.string_agg(row_to_json(t)::text, '|' order by attempt_id, projection_kind), '')) from public.commerce_payment_reconciliation t)
     ))`,
    { quiet: true },
  );
}

function createDatabase(name) {
  command(binaries.createdb, [
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-U",
    user,
    name,
  ], { quiet: true, phase: `createdb:${name}` });
}

function createConcurrencyFixture(database, suffix, amount) {
  const ids = {
    business: `1343${suffix}00-0000-4000-8000-000000000001`,
    oldCustomer: `1343${suffix}00-0000-4000-8000-000000000002`,
    newCustomer: `1343${suffix}00-0000-4000-8000-000000000003`,
    appointment: `1343${suffix}00-0000-4000-8000-000000000004`,
    key: `1343${suffix}00-0000-4000-8000-000000000005`,
  };
  sql(
    database,
    `insert into public.businesses(id, name, currency)
       values ('${ids.business}', 'Issue 134 concurrency ${suffix}', 'cad');
     insert into public.customers(id, business_id, name) values
       ('${ids.oldCustomer}', '${ids.business}', 'Old customer'),
       ('${ids.newCustomer}', '${ids.business}', 'New customer');
     insert into public.appointments(id, business_id, customer_id)
       values ('${ids.appointment}', '${ids.business}', '${ids.oldCustomer}');
     set role service_role;
     select outcome, attempt_id
     from public.admit_payment_attempt_v1(
       '${ids.business}', '${ids.key}', 'v1:' || repeat('${suffix[0]}', 64),
       'collect_payment', '${ids.oldCustomer}', '${ids.appointment}',
       '13410000-0000-4000-8000-000000000001',
       'payment', ${amount}, 'cad', 'cash', 'manual'
     )`,
    { quiet: true },
  );
  ids.attempt = sql(
    database,
    `select id from public.commerce_payment_attempts
     where business_id = '${ids.business}' and attempt_key = '${ids.key}'`,
    { quiet: true },
  );
  return ids;
}

function assertAttemptState(database, ids, expected) {
  const observed = sql(
    database,
    `select
       (select customer_id::text from public.appointments where id = '${ids.appointment}'),
       (select execution_state from public.commerce_payment_attempts where id = '${ids.attempt}'),
       (select count(*) from public.commerce_payment_attempts where attempt_key = '${ids.key}'),
       (select count(*) from public.commerce_transactions where payment_attempt_id = '${ids.attempt}'),
       (select count(*) from public.commerce_payment_attempt_events where attempt_id = '${ids.attempt}' and event_type = 'ACCEPTED'),
       (select count(*) from public.commerce_payment_reconciliation where attempt_id = '${ids.attempt}')`,
    { quiet: true },
  );
  if (observed !== expected) {
    throw new Error(`Unexpected concurrency state: ${observed}; expected ${expected}`);
  }
}

function hasExactOutputLine(output, expected) {
  return output
    .split(/\r?\n/)
    .some((line) => line.trim() === expected);
}

try {
  sourceIdentityBefore = captureSourceIdentity();
  evidence.sourceIdentityBefore = sourceIdentityBefore;
  writeFileSync(
    sourceIdentityBeforePath,
    `${JSON.stringify(sourceIdentityBefore, null, 2)}\n`,
    { flag: "wx", mode: 0o600 },
  );
  port = await availableLoopbackPort();
  writeFileSync(ownershipMarkerPath, `${marker}\n`, {
    flag: "wx",
    mode: 0o600,
  });
  mkdirSync(dataDir);
  command(binaries.initdb, [
    "-D",
    dataDir,
    "--username",
    user,
    "--auth-local=trust",
    "--auth-host=trust",
    "--encoding=UTF8",
    "--locale=C",
  ], { quiet: true, phase: "cluster:initdb" });
  writeFileSync(markerPath, `${marker}\n`, { flag: "wx", mode: 0o600 });
  if (readFileSync(markerPath, "utf8").trim() !== marker) {
    throw new Error("Disposable-cluster marker verification failed before startup");
  }

  startAttempted = true;
  command(binaries.pgCtl, [
    "-D",
    dataDir,
    "-l",
    serverLog,
    "-o",
    `-c listen_addresses=127.0.0.1 -c port=${port} -c unix_socket_directories='' -c logging_collector=off`,
    "-w",
    "start",
  ], { quiet: true, phase: "cluster:start" });

  const binding = sql(
    "postgres",
    `select current_setting('listen_addresses'),
            pg_catalog.host(pg_catalog.inet_server_addr()),
            inet_server_port(),
            current_setting('server_version_num')::integer >= 170000,
            current_setting('data_directory')
    `,
    { quiet: true },
  );
  const [
    listenAddresses,
    serverAddress,
    serverPort,
    isPostgres17,
    observedDataDirectory,
  ] = binding.split("|");
  if (
    listenAddresses !== "127.0.0.1" ||
    serverAddress !== "127.0.0.1" ||
    serverPort !== String(port) ||
    isPostgres17 !== "t" ||
    !observedDataDirectory ||
    realpathSync(observedDataDirectory) !== realpathSync(dataDir)
  ) {
    throw new Error(`Disposable cluster binding/version mismatch: ${binding}`);
  }
  evidence.dataDirectory = realpathSync(observedDataDirectory);
  if (readFileSync(markerPath, "utf8").trim() !== marker) {
    throw new Error("Disposable-cluster marker changed before synthetic writes");
  }
  evidence.postgresVersion = sql("postgres", "show server_version", {
    quiet: true,
  });
  console.log(
    `PASS disposable PostgreSQL ${evidence.postgresVersion} owns marker ${marker} and listens only on 127.0.0.1:${port}`,
  );

  createDatabase("issue134_success");
  files(
    "issue134_success",
    [
      "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql",
      "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql",
      "tests/postgres/issue-134-r1a-manual-kernel-fixture.sql",
      "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql",
      "tests/postgres/issue-134-r1a-manual-kernel-contract.sql",
    ],
    { quiet: true },
  );
  console.log("PASS accepted R1a executable PostgreSQL contract loaded unchanged");

  sql(
    "issue134_success",
    `insert into public.appointments(id, business_id, customer_id)
       select pg_catalog.md5('issue134-bounded-appointment-' || value)::uuid,
              '13410000-0000-4000-8000-000000000011',
              '13410000-0000-4000-8000-000000000021'
       from generate_series(1, 2000) value;
     insert into public.commerce_transactions(
       id, business_id, customer_id, appointment_id, kind, status, method,
       amount_cents, currency, provider, provider_reference
     )
       select pg_catalog.md5('issue134-bounded-ledger-' || value)::uuid,
              '13410000-0000-4000-8000-000000000011',
              '13410000-0000-4000-8000-000000000021',
              pg_catalog.md5('issue134-bounded-appointment-' || value)::uuid,
              'payment', 'succeeded', 'cash', value, 'cad', 'manual',
              'issue134-bounded-' || value
       from generate_series(1, 2000) value`,
    { quiet: true },
  );
  const beforeDigest = digest("issue134_success");
  const migrationStarted = Date.now();
  file(
    "issue134_success",
    "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql",
    { quiet: true },
  );
  evidence.migrationElapsedMs = Date.now() - migrationStarted;
  const afterDigest = digest("issue134_success");
  if (afterDigest !== beforeDigest) {
    throw new Error("Migration changed existing fixture rows");
  }
  const boundedFixture = sql(
    "issue134_success",
    `select
       (select count(*) from public.appointments),
       (select count(*) from public.commerce_transactions),
       pg_relation_size('public.appointments'),
       pg_relation_size('public.commerce_transactions'),
       pg_relation_size('public.appointments_id_business_customer_financial_key')`,
    { quiet: true },
  );
  evidence.boundedFixture = boundedFixture;
  console.log(
    `PASS bounded 2,000-row index/FK validation in ${evidence.migrationElapsedMs}ms; rows/digest preserved; sizes=${boundedFixture}`,
  );

  file(
    "issue134_success",
    "tests/postgres/issue-134-appointment-financial-attribution-contract.sql",
  );

  sql(
    "issue134_success",
    `create function public.issue134_attribution_delay_insert()
     returns trigger language plpgsql as $$
     begin
       if new.provider_reference =
          current_setting('issue134.delay_reference', true) then
         perform pg_catalog.pg_sleep(1.5);
       end if;
       return new;
     end $$;
     create trigger issue134_attribution_delay_insert
       after insert on public.commerce_transactions
       for each row execute function public.issue134_attribution_delay_insert()`,
    { quiet: true },
  );

  const paymentFirst = createConcurrencyFixture("10", 501);
  const paymentFirstPromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_payment_first';
     begin;
     set local role service_role;
     set local issue134.delay_reference = 'manual-attempt:${paymentFirst.attempt}';
     select outcome from public.commit_manual_payment_attempt_v1(
       '${paymentFirst.business}', '${paymentFirst.attempt}'
     );
     commit`,
    "concurrency:payment-first:commit",
  );
  waitForActivity(
    "issue134_payment_first",
    ([, , waitEvent]) => waitEvent === "PgSleep",
  );
  const paymentFirstUpdatePromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_payment_first_update';
     update public.appointments
     set customer_id = '${paymentFirst.newCustomer}'
     where id = '${paymentFirst.appointment}'`,
    "concurrency:payment-first:reassignment",
  );
  waitForActivity(
    "issue134_payment_first_update",
    ([, waitType]) => waitType === "Lock",
  );
  const [paymentFirstResult, paymentFirstUpdate] = await Promise.all([
    paymentFirstPromise,
    paymentFirstUpdatePromise,
  ]);
  if (
    paymentFirstResult.status !== 0 ||
    !hasExactOutputLine(paymentFirstResult.stdout, "RECORDED") ||
    paymentFirstUpdate.status === 0 ||
    !paymentFirstUpdate.stderr.includes(
      "commerce_transactions_appt_business_customer_financial_fk",
    )
  ) {
    throw new Error("Payment-first interleaving result mismatch");
  }
  assertAttemptState(
    "issue134_success",
    paymentFirst,
    `${paymentFirst.oldCustomer}|ACCEPTED|1|1|1|4`,
  );
  evidence.concurrency.push("payment-commit-first");
  console.log("PASS true multi-session payment-first commit blocks and rejects reassignment");

  const paymentRollback = createConcurrencyFixture("20", 502);
  const paymentRollbackPromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_payment_rollback';
     begin;
     set local role service_role;
     set local issue134.delay_reference = 'manual-attempt:${paymentRollback.attempt}';
     select outcome from public.commit_manual_payment_attempt_v1(
       '${paymentRollback.business}', '${paymentRollback.attempt}'
     );
     rollback`,
    "concurrency:payment-rollback:payment",
  );
  waitForActivity(
    "issue134_payment_rollback",
    ([, , waitEvent]) => waitEvent === "PgSleep",
  );
  const paymentRollbackUpdatePromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_payment_rollback_update';
     update public.appointments
     set customer_id = '${paymentRollback.newCustomer}'
     where id = '${paymentRollback.appointment}'`,
    "concurrency:payment-rollback:reassignment",
  );
  waitForActivity(
    "issue134_payment_rollback_update",
    ([, waitType]) => waitType === "Lock",
  );
  const [paymentRollbackResult, paymentRollbackUpdate] = await Promise.all([
    paymentRollbackPromise,
    paymentRollbackUpdatePromise,
  ]);
  if (paymentRollbackResult.status !== 0 || paymentRollbackUpdate.status !== 0) {
    throw new Error("Payment-rollback interleaving result mismatch");
  }
  assertAttemptState(
    "issue134_success",
    paymentRollback,
    `${paymentRollback.newCustomer}|REQUESTED|1|0|0|0`,
  );
  evidence.concurrency.push("payment-rollback-first");
  console.log("PASS true multi-session payment rollback releases reassignment with zero financial effect");

  const reassignmentFirst = createConcurrencyFixture("30", 503);
  const reassignmentFirstPromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_reassignment_first';
     begin;
     update public.appointments
     set customer_id = '${reassignmentFirst.newCustomer}'
     where id = '${reassignmentFirst.appointment}';
     select pg_catalog.pg_sleep(1.5);
     commit`,
    "concurrency:reassignment-first:reassignment",
  );
  waitForActivity(
    "issue134_reassignment_first",
    ([, , waitEvent]) => waitEvent === "PgSleep",
  );
  const reassignmentFirstPaymentPromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_reassignment_first_payment';
     set role service_role;
     select outcome from public.commit_manual_payment_attempt_v1(
       '${reassignmentFirst.business}', '${reassignmentFirst.attempt}'
     )`,
    "concurrency:reassignment-first:payment",
  );
  waitForActivity(
    "issue134_reassignment_first_payment",
    ([, waitType]) => waitType === "Lock",
  );
  const [reassignmentFirstResult, reassignmentFirstPayment] = await Promise.all([
    reassignmentFirstPromise,
    reassignmentFirstPaymentPromise,
  ]);
  if (
    reassignmentFirstResult.status !== 0 ||
    reassignmentFirstPayment.status === 0 ||
    !reassignmentFirstPayment.stderr.includes(
      "commerce_transactions_appt_business_customer_financial_fk",
    )
  ) {
    throw new Error("Reassignment-first interleaving result mismatch");
  }
  assertAttemptState(
    "issue134_success",
    reassignmentFirst,
    `${reassignmentFirst.newCustomer}|REQUESTED|1|0|0|0`,
  );
  evidence.concurrency.push("reassignment-commit-first");
  console.log("PASS reassignment-first commit rejects R1a and rolls back ACCEPTED/ledger/event/obligations without a new key");

  const reassignmentRollback = createConcurrencyFixture("40", 504);
  const reassignmentRollbackPromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_reassignment_rollback';
     begin;
     update public.appointments
     set customer_id = '${reassignmentRollback.newCustomer}'
     where id = '${reassignmentRollback.appointment}';
     select pg_catalog.pg_sleep(1.5);
     rollback`,
    "concurrency:reassignment-rollback:reassignment",
  );
  waitForActivity(
    "issue134_reassignment_rollback",
    ([, , waitEvent]) => waitEvent === "PgSleep",
  );
  const reassignmentRollbackPaymentPromise = sqlAsync(
    "issue134_success",
    `set application_name = 'issue134_reassignment_rollback_payment';
     set role service_role;
     select outcome from public.commit_manual_payment_attempt_v1(
       '${reassignmentRollback.business}', '${reassignmentRollback.attempt}'
     )`,
    "concurrency:reassignment-rollback:payment",
  );
  waitForActivity(
    "issue134_reassignment_rollback_payment",
    ([, waitType]) => waitType === "Lock",
  );
  const [reassignmentRollbackResult, reassignmentRollbackPayment] =
    await Promise.all([
      reassignmentRollbackPromise,
      reassignmentRollbackPaymentPromise,
    ]);
  if (
    reassignmentRollbackResult.status !== 0 ||
    reassignmentRollbackPayment.status !== 0 ||
    !hasExactOutputLine(reassignmentRollbackPayment.stdout, "RECORDED")
  ) {
    throw new Error("Reassignment-rollback interleaving result mismatch");
  }
  assertAttemptState(
    "issue134_success",
    reassignmentRollback,
    `${reassignmentRollback.oldCustomer}|ACCEPTED|1|1|1|4`,
  );
  evidence.concurrency.push("reassignment-rollback-first");
  console.log("PASS reassignment rollback permits the waiting canonical payment exactly once");

  createDatabase("issue134_timeout");
  loadAcceptedBaseline("issue134_timeout");
  const timeoutBefore = digest("issue134_timeout");
  const lockHolder = sqlAsync(
    "issue134_timeout",
    `set application_name = 'issue134_lock_holder';
     begin;
     lock table public.appointments in access exclusive mode;
     select pg_catalog.pg_sleep(6.5);
     rollback`,
    "timeout:lock-holder",
  );
  waitForActivity(
    "issue134_lock_holder",
    ([, , waitEvent]) => waitEvent === "PgSleep",
  );
  const timeoutStarted = Date.now();
  const timeoutApply = spawnSync(
    binaries.psql,
    psqlArgs("issue134_timeout", [
      "-f",
      resolve(
        root,
        "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql",
      ),
    ]),
    { encoding: "utf8", stdio: "pipe", env: childEnv },
  );
  recordPhase(
    "timeout:migration-apply",
    timeoutApply.status,
    timeoutApply.error,
    timeoutApply.stdout ?? "",
    timeoutApply.stderr ?? "",
    true,
  );
  evidence.lockTimeoutElapsedMs = Date.now() - timeoutStarted;
  await lockHolder;
  if (
    timeoutApply.status === 0 ||
    !/lock timeout|canceling statement due to lock timeout/i.test(
      timeoutApply.stderr ?? "",
    ) ||
    evidence.lockTimeoutElapsedMs < 4500 ||
    evidence.lockTimeoutElapsedMs > 6500
  ) {
    throw new Error(
      `Migration lock-timeout proof mismatch (${evidence.lockTimeoutElapsedMs}ms): ${timeoutApply.stderr}`,
    );
  }
  const timeoutObjects = sql(
    "issue134_timeout",
    `select
       to_regclass('public.appointments_id_business_customer_financial_key') is null,
       to_regprocedure('public.guard_legacy_commerce_transaction_appointment_attribution_v1()') is null`,
    { quiet: true },
  );
  if (
    timeoutObjects !== "t|t" ||
    digest("issue134_timeout") !== timeoutBefore
  ) {
    throw new Error("Timed-out migration left partial objects or row changes");
  }
  console.log(
    `PASS ${evidence.lockTimeoutElapsedMs}ms lock-timeout rollback left zero partial objects and unchanged rows`,
  );

  passed = true;
  evidence.passed = true;
  console.log("Issue #134 appointment financial-attribution PostgreSQL contract passed.");
} catch (error) {
  originalFailure = error;
  evidence.originalFailure = failureSummary(error);
}

evidence.passed = passed;
let cleanupFailure = null;
let stopConfirmed = !startAttempted;
try {
  if (startAttempted) {
    const stop = spawnSync(
      binaries.pgCtl,
      ["-D", dataDir, "-m", "fast", "-w", "stop"],
      { encoding: "utf8", stdio: "pipe", env: childEnv },
    );
    const status = spawnSync(
      binaries.pgCtl,
      ["-D", dataDir, "status"],
      { encoding: "utf8", stdio: "pipe", env: childEnv },
    );
    recordPhase(
      "cluster:stop",
      stop.status,
      stop.error,
      stop.stdout ?? "",
      stop.stderr ?? "",
    );
    recordPhase(
      "cluster:status-after-stop",
      status.status,
      status.error,
      status.stdout ?? "",
      status.stderr ?? "",
    );
    evidence.stopCommandStatus = stop.status;
    evidence.statusCommandStatus = status.status;
    stopConfirmed = !status.error && status.status === 3;
    if (!stopConfirmed) {
      throw new Error(
        `Disposable PostgreSQL stop is unconfirmed; stop=${stop.status}, status=${status.status}`,
      );
    }
  }
  evidence.stopConfirmed = stopConfirmed;

  if (existsSync(dataDir)) {
    if (!stopConfirmed) {
      throw new Error("Refusing PGDATA removal without confirmed server stop");
    }
    const ownedByInnerMarker =
      existsSync(markerPath) &&
      readFileSync(markerPath, "utf8").trim() === marker;
    const ownedByOuterMarker =
      existsSync(ownershipMarkerPath) &&
      readFileSync(ownershipMarkerPath, "utf8").trim() === marker;
    if (!ownedByInnerMarker && !ownedByOuterMarker) {
      throw new Error(
        "Refusing disposable-data cleanup: ownership marker mismatch",
      );
    }
    rmSync(dataDir, { recursive: true });
    if (existsSync(dataDir)) {
      throw new Error("Disposable PostgreSQL data directory still exists");
    }
  }
  evidence.pgdataRemoved = !existsSync(dataDir);
} catch (error) {
  cleanupFailure = error;
  evidence.cleanupFailure = failureSummary(error);
  evidence.stopConfirmed = stopConfirmed;
}

let sourceIdentityFailure = null;
try {
  evidence.sourceIdentityAfter = captureSourceIdentity();
  writeFileSync(
    sourceIdentityAfterPath,
    `${JSON.stringify(evidence.sourceIdentityAfter, null, 2)}\n`,
    { flag: "wx", mode: 0o600 },
  );
  evidence.sourceIdentityMatched =
    sourceIdentityBefore !== null &&
    JSON.stringify(evidence.sourceIdentityAfter) ===
      JSON.stringify(sourceIdentityBefore);
  if (!evidence.sourceIdentityMatched) {
    throw new Error("Verifier source identity changed during execution");
  }
} catch (error) {
  sourceIdentityFailure = error;
  evidence.sourceIdentityFailure = failureSummary(error);
  evidence.sourceIdentityMatched = false;
  evidence.passed = false;
  passed = false;
  if (!originalFailure) {
    originalFailure = error;
    evidence.originalFailure = failureSummary(error);
  }
}

writeFileSync(summaryPath, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
});

if (evidence.pgdataRemoved) {
  console.log(
    `PASS owned PGDATA removed after confirmed stop state; retained local evidence: ${summaryPath}`,
  );
} else {
  console.error(
    `RETAINED owned PGDATA because cleanup was not confirmed; evidence: ${summaryPath}`,
  );
}

if (originalFailure) {
  if (cleanupFailure) {
    console.error(
      `Cleanup failure after original failure: ${cleanupFailure.message}`,
    );
  }
  if (sourceIdentityFailure && sourceIdentityFailure !== originalFailure) {
    console.error(
      `Source identity failure after original failure: ${sourceIdentityFailure.message}`,
    );
  }
  throw originalFailure;
}
if (cleanupFailure) throw cleanupFailure;
