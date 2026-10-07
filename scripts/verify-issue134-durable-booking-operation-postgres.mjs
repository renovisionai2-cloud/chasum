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

const args = process.argv.slice(2);
if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
  console.log(
    "Usage: node scripts/verify-issue134-durable-booking-operation-postgres.mjs --confirm-disposable-local",
  );
  console.log(
    "Creates an owned loopback-only PostgreSQL 17 cluster, captures local evidence, confirms shutdown, and removes only marker-owned PGDATA.",
  );
  process.exit(0);
}
if (
  args.length !== 1 ||
  args[0] !== "--confirm-disposable-local"
) {
  console.error(
    "Refusing to start. Pass exactly --confirm-disposable-local after independent source review.",
  );
  process.exit(2);
}

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
const sourcePaths = [
  "supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql",
  "lib/booking-engine/types.ts",
  "lib/booking-engine/persistence.ts",
  "lib/booking-engine/mutations/create.ts",
  "lib/commerce/booking-operations/types.ts",
  "lib/commerce/booking-operations/normalize.ts",
  "lib/commerce/booking-operations/kernel.ts",
  "lib/commerce/booking-operations/index.ts",
  "tests/unit/booking/create-booking-persistence.test.ts",
  "tests/unit/commerce/booking-operation-normalization.test.ts",
  "tests/unit/commerce/booking-operation-kernel.test.ts",
  "tests/unit/migrations/issue134-durable-booking-operation.test.ts",
  "tests/postgres/issue-134-durable-booking-operation-contract.sql",
  "scripts/verify-issue134-durable-booking-operation-postgres.mjs",
  "docs/reviews/issue-134-durable-booking-deposit-implementation.md",
  "docs/CHANGELOG.md",
];
const acceptedSources = {
  "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql":
    "dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47",
  "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql":
    "4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7",
  "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql":
    "fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524",
};
const evidenceDir = mkdtempSync(
  join(tmpdir(), "chasum-issue134-durable-evidence-"),
);
const privateHome = join(evidenceDir, "home");
const privatePgpass = join(privateHome, ".pgpass");
const privateServiceFile = join(privateHome, "pg_service.conf");
const dataDir = join(evidenceDir, "pgdata");
const markerPath = join(dataDir, ".chasum-issue134-durable-disposable");
const ownershipMarkerPath = join(evidenceDir, "ownership-marker");
const serverLog = join(evidenceDir, "postgres.log");
const phaseLogPath = join(evidenceDir, "phases.jsonl");
const concurrencyPath = join(evidenceDir, "concurrency-responses.json");
const summaryPath = join(evidenceDir, "summary.json");
const sourceIdentityBeforePath = join(evidenceDir, "source-identity-before.json");
const sourceIdentityAfterPath = join(evidenceDir, "source-identity-after.json");
const marker = `issue134-durable-${randomBytes(16).toString("hex")}`;
const user = userInfo().username;

mkdirSync(privateHome, { mode: 0o700 });
writeFileSync(privatePgpass, "", { flag: "wx", mode: 0o600 });
writeFileSync(privateServiceFile, "", { flag: "wx", mode: 0o600 });
writeFileSync(phaseLogPath, "", { flag: "wx", mode: 0o600 });
writeFileSync(concurrencyPath, "[]\n", { flag: "wx", mode: 0o600 });

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
  SUPABASE_SERVICE_ROLE_KEY: "forbidden",
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
    "SUPABASE_SERVICE_ROLE_KEY",
  ].some((key) => Object.hasOwn(poisoned, key))
) {
  throw new Error("Minimal child-environment sanitization self-test failed");
}
const childEnv = createChildEnv();

function sha256File(path) {
  return createHash("sha256")
    .update(readFileSync(resolve(root, path)))
    .digest("hex");
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
    throw head.error ?? new Error("Could not record repository HEAD");
  }
  for (const [path, expected] of Object.entries(acceptedSources)) {
    const observed = sha256File(path);
    if (observed !== expected) {
      throw new Error(`Protected accepted source changed: ${path}`);
    }
  }
  return {
    repositoryHead,
    files: Object.fromEntries(
      sourcePaths.map((path) => [path, sha256File(path)]),
    ),
    acceptedSources,
  };
}

let phaseSequence = 0;
function recordPhase(phase, status, error, stdout = "", stderr = "") {
  phaseSequence += 1;
  appendFileSync(
    phaseLogPath,
    `${JSON.stringify({
      sequence: phaseSequence,
      phase,
      status,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : error
            ? { name: "Error", message: String(error) }
            : null,
      stdout,
      stderr,
    })}\n`,
  );
}

function command(path, commandArgs, options = {}) {
  const { quiet = false, phase = path, ...spawnOptions } = options;
  const result = spawnSync(path, commandArgs, {
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
  );
  if (!quiet) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  if (result.error || result.status !== 0) {
    throw (
      result.error ??
      new Error(`${path} exited ${result.status}: ${result.stderr ?? ""}`)
    );
  }
  return result;
}

let port;
function psqlArgs(extra = []) {
  return [
    "-h",
    "127.0.0.1",
    "-p",
    String(port),
    "-U",
    user,
    "-d",
    "issue134_durable",
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    ...extra,
  ];
}

function sql(statement, options = {}) {
  return command(
    binaries.psql,
    psqlArgs(["-At", "-F", "|", "-c", statement]),
    { ...options, phase: options.phase ?? "sql" },
  ).stdout.trim();
}

function startSqlAsync(statement, phase, { discardOutput = false } = {}) {
  const child = spawn(
    binaries.psql,
    psqlArgs(["-At", "-F", "|", "-c", statement]),
    { stdio: ["ignore", "pipe", "pipe"], env: childEnv },
  );
  const completion = new Promise((complete) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      recordPhase(phase, result.status, result.error, result.stdout, result.stderr);
      complete(result);
    };
    child.stdout.on("data", (chunk) => {
      if (!discardOutput) stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      finish({ status: 1, error, stdout, stderr: `${stderr}${error.message}` });
    });
    child.on("close", (status) => {
      finish({ status: status ?? 1, error: null, stdout, stderr });
    });
  });
  return { child, completion };
}

function sqlAsync(statement, phase) {
  return startSqlAsync(statement, phase).completion;
}

async function sqlLostResponse(statement, applicationName, phase) {
  const { child, completion } = startSqlAsync(
    `set application_name='${applicationName}';
     begin;
     set local role service_role;
     ${statement};
     commit;
     select pg_catalog.pg_sleep(30)`,
    phase,
    { discardOutput: true },
  );
  waitForActivity(
    applicationName,
    ([, , event]) => event === "PgSleep",
  );
  if (!child.kill("SIGKILL")) {
    throw new Error(`Could not terminate lost-response client ${applicationName}`);
  }
  const result = await completion;
  if (result.status === 0) {
    throw new Error(`Lost-response client ${applicationName} exited cleanly`);
  }
  recordPhase(
    `${phase}:classified`,
    0,
    null,
    "UNKNOWN: committed boundary response was deliberately discarded",
  );
  return result;
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function waitForActivity(applicationName, predicate, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = sql(
      `select coalesce(state,''),coalesce(wait_event_type,''),coalesce(wait_event,'')
       from pg_catalog.pg_stat_activity
       where application_name='${applicationName}'
       order by backend_start desc limit 1`,
      { quiet: true, phase: `observe:${applicationName}` },
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
      server.close(() => resolvePort(address.port));
    });
  });
}

const concurrencyResponses = [];
function captureConcurrency(name, results) {
  const capture = {
    name,
    results: results.map(({ status, stdout, stderr }) => ({
      status,
      stdout,
      stderr,
    })),
  };
  concurrencyResponses.push(capture);
  writeFileSync(
    concurrencyPath,
    `${JSON.stringify(concurrencyResponses, null, 2)}\n`,
    { mode: 0o600 },
  );
  return capture;
}

function finalRow(result) {
  return result.stdout.trim().split(/\r?\n/).filter(Boolean).at(-1) ?? "";
}

function requireStatuses(name, results) {
  if (results.some((result) => result.status !== 0)) {
    throw new Error(`${name} returned an infrastructure error`);
  }
}

let startAttempted = false;
let stopConfirmed = false;
let passed = false;
let originalFailure = null;
let cleanupFailure = null;
let sourceIdentityBefore = null;
const summary = {
  marker,
  evidenceDir,
  phaseLog: phaseLogPath,
  concurrencyResponses: concurrencyPath,
  serverLog,
  sourceIdentityBefore: null,
  sourceIdentityAfter: null,
  sourceIdentityMatched: false,
  postgresVersion: null,
  dataDirectory: null,
  fixtureSetup: "NOT_STARTED",
  concurrency: [],
  recovery: [],
  stopConfirmed: false,
  pgdataRemoved: false,
  passed: false,
  originalFailure: null,
  cleanupFailure: null,
};

try {
  sourceIdentityBefore = captureSourceIdentity();
  summary.sourceIdentityBefore = sourceIdentityBefore;
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
  command(
    binaries.initdb,
    [
      "-D",
      dataDir,
      "--username",
      user,
      "--auth-local=trust",
      "--auth-host=trust",
      "--encoding=UTF8",
      "--locale=C",
    ],
    { quiet: true, phase: "cluster:initdb" },
  );
  writeFileSync(markerPath, `${marker}\n`, { flag: "wx", mode: 0o600 });
  if (readFileSync(markerPath, "utf8").trim() !== marker) {
    throw new Error("Disposable ownership marker mismatch before startup");
  }

  startAttempted = true;
  command(
    binaries.pgCtl,
    [
      "-D",
      dataDir,
      "-l",
      serverLog,
      "-o",
      `-c listen_addresses=127.0.0.1 -c port=${port} -c unix_socket_directories='' -c logging_collector=off`,
      "-w",
      "start",
    ],
    { quiet: true, phase: "cluster:start" },
  );
  const binding = command(
    binaries.psql,
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      user,
      "-d",
      "postgres",
      "-X",
      "-At",
      "-F",
      "|",
      "-c",
      "select current_setting('listen_addresses'),host(inet_server_addr()),inet_server_port(),current_setting('server_version_num')::integer>=170000,current_setting('data_directory')",
    ],
    { quiet: true, phase: "cluster:binding" },
  ).stdout.trim();
  const [listen, address, observedPort, postgres17, observedDataDir] =
    binding.split("|");
  if (
    listen !== "127.0.0.1" ||
    address !== "127.0.0.1" ||
    observedPort !== String(port) ||
    postgres17 !== "t" ||
    realpathSync(observedDataDir) !== realpathSync(dataDir)
  ) {
    throw new Error(`Disposable cluster binding mismatch: ${binding}`);
  }
  summary.dataDirectory = realpathSync(observedDataDir);
  summary.postgresVersion = command(
    binaries.psql,
    [
      "-h",
      "127.0.0.1",
      "-p",
      String(port),
      "-U",
      user,
      "-d",
      "postgres",
      "-X",
      "-At",
      "-c",
      "show server_version",
    ],
    { quiet: true, phase: "cluster:version" },
  ).stdout.trim();

  command(
    binaries.createdb,
    ["-h", "127.0.0.1", "-p", String(port), "-U", user, "issue134_durable"],
    { quiet: true, phase: "fixture:createdb" },
  );
  command(
    binaries.psql,
    psqlArgs([
      "-f",
      resolve(
        root,
        "tests/postgres/issue-134-durable-booking-operation-contract.sql",
      ),
    ]),
    { phase: "fixture:contract" },
  );
  summary.fixtureSetup = "PASS";

  const sameOperationSql = `
    set role service_role;
    select public.issue134_bootstrap(
      '15800000-0000-4000-8000-000000000300',
      '15800000-0000-4000-8000-000000000301',
      '15800000-0000-4000-8000-000000000040',
      'deposit','deposit',5000,'cash','manual'
    )`;
  const sameOperation = await Promise.all([
    sqlAsync(sameOperationSql, "concurrency:same-operation:a"),
    sqlAsync(sameOperationSql, "concurrency:same-operation:b"),
  ]);
  captureConcurrency("same-operation-bootstrap", sameOperation);
  requireStatuses("same-operation bootstrap", sameOperation);
  const sameOutcomes = sameOperation.map(finalRow).sort();
  if (JSON.stringify(sameOutcomes) !== JSON.stringify(["ADMITTED", "EXISTING"])) {
    throw new Error(`same-operation outcomes mismatch: ${sameOutcomes}`);
  }
  summary.concurrency.push("same-operation-bootstrap");

  const inlineRace = await Promise.all([
    sqlAsync(
      `set role service_role; select public.issue134_bootstrap_inline(
        '15800000-0000-4000-8000-000000000310',
        '15800000-0000-4000-8000-000000000311',
        '15800000-0000-4000-8000-000000000312',
        'inline-race@example.com','19055550999')`,
      "concurrency:inline-email-phone:a",
    ),
    sqlAsync(
      `set role service_role; select public.issue134_bootstrap_inline(
        '15800000-0000-4000-8000-000000000320',
        '15800000-0000-4000-8000-000000000321',
        '15800000-0000-4000-8000-000000000322',
        'inline-race@example.com','19055550999')`,
      "concurrency:inline-email-phone:b",
    ),
  ]);
  captureConcurrency("independent-inline-email-phone-race", inlineRace);
  requireStatuses("inline identity race", inlineRace);
  const inlineOutcomes = inlineRace.map(finalRow).sort();
  if (
    JSON.stringify(inlineOutcomes) !==
    JSON.stringify(["ADMITTED", "CUSTOMER_MATCH_REQUIRES_SELECTION"])
  ) {
    throw new Error(`inline race outcomes mismatch: ${inlineOutcomes}`);
  }
  summary.concurrency.push("independent-inline-email-phone-race");

  const persistSql = `
    set role service_role;
    select outcome,appointment_id
    from public.persist_booking_operation_appointment_v1(
      '15800000-0000-4000-8000-000000000001',
      '15800000-0000-4000-8000-000000000300',
      '15800000-0000-4000-8000-000000000002',
      '15800000-0000-4000-8000-000000000040',
      '15800000-0000-4000-8000-000000000010',
      '15800000-0000-4000-8000-000000000020',
      '15800000-0000-4000-8000-000000000030',
      '2026-10-08T14:00:00.000Z','2026-10-08T15:00:00.000Z',
      'confirmed',60,null,null,array[
        '15800000-0000-4000-8000-000000000060'::uuid,
        '15800000-0000-4000-8000-000000000061'::uuid
      ],null,null,10000,0,5000
    )`;
  const appointmentRace = await Promise.all([
    sqlAsync(persistSql, "concurrency:appointment:a"),
    sqlAsync(persistSql, "concurrency:appointment:b"),
  ]);
  captureConcurrency("same-operation-appointment", appointmentRace);
  requireStatuses("appointment race", appointmentRace);
  const appointmentRows = appointmentRace.map(finalRow);
  const appointmentOutcomes = appointmentRows.map((row) => row.split("|")[0]).sort();
  const appointmentIds = appointmentRows.map((row) => row.split("|")[1]);
  if (
    JSON.stringify(appointmentOutcomes) !==
      JSON.stringify(["CREATED", "EXISTING"]) ||
    !appointmentIds[0] ||
    appointmentIds[0] !== appointmentIds[1]
  ) {
    throw new Error(`appointment race mismatch: ${appointmentRows}`);
  }
  const appointmentId = appointmentIds[0];
  const attemptId = sql(
    `select id from public.commerce_payment_attempts
     where booking_operation_id='15800000-0000-4000-8000-000000000300'`,
    { quiet: true, phase: "concurrency:attempt-id" },
  );
  sql(
    `set role service_role;
     select outcome from public.bind_booking_operation_appointment_v1(
       '15800000-0000-4000-8000-000000000001',
       '15800000-0000-4000-8000-000000000300',
       '15800000-0000-4000-8000-000000000002',
       '${appointmentId}')`,
    { quiet: true, phase: "concurrency:bind" },
  );
  const commitSql = `
    set role service_role;
    select outcome,transaction_id,recorded,synchronization
    from public.commit_booking_operation_manual_payment_v1(
      '15800000-0000-4000-8000-000000000001',
      '15800000-0000-4000-8000-000000000300',
      '15800000-0000-4000-8000-000000000002',
      '${attemptId}')`;
  const commitRace = await Promise.all([
    sqlAsync(commitSql, "concurrency:commit:a"),
    sqlAsync(commitSql, "concurrency:commit:b"),
  ]);
  captureConcurrency("same-attempt-commit", commitRace);
  requireStatuses("commit race", commitRace);
  const commitRows = commitRace.map(finalRow);
  const commitOutcomes = commitRows.map((row) => row.split("|")[0]).sort();
  const transactionIds = commitRows.map((row) => row.split("|")[1]);
  if (
    JSON.stringify(commitOutcomes) !== JSON.stringify(["RECORDED", "REPLAY"]) ||
    !transactionIds[0] ||
    transactionIds[0] !== transactionIds[1]
  ) {
    throw new Error(`commit race mismatch: ${commitRows}`);
  }
  summary.concurrency.push("same-operation-appointment", "same-attempt-commit");

  const nullStaffOperation = "15800000-0000-4000-8000-000000000360";
  const nullStaffAdmitted = sql(
    `set role service_role;
     select public.issue134_bootstrap(
       '${nullStaffOperation}',
       '15800000-0000-4000-8000-000000000361',
       '15800000-0000-4000-8000-000000000040',
       'deposit','deposit',5000,'cash','manual','booking_sheet',null
     )`,
    { quiet: true, phase: "concurrency:null-staff:bootstrap" },
  );
  if (nullStaffAdmitted !== "ADMITTED") {
    throw new Error(`NULL-staff operation was not admitted: ${nullStaffAdmitted}`);
  }
  const nullStaffPersistSql = persistSql
    .replaceAll(
      "15800000-0000-4000-8000-000000000300",
      nullStaffOperation,
    )
    .replace("'15800000-0000-4000-8000-000000000030'", "null");
  const nullStaffFirst = sqlAsync(
    `set application_name='issue134_null_staff_first';
     set statement_timeout='5s';
     begin;
     set local role service_role;
     ${nullStaffPersistSql.replace("set role service_role;", "")};
     select pg_catalog.pg_sleep(1.2);
     commit`,
    "concurrency:null-staff:a",
  );
  waitForActivity(
    "issue134_null_staff_first",
    ([, , event]) => event === "PgSleep",
  );
  const nullStaffSecond = sqlAsync(
    `set application_name='issue134_null_staff_second';
     set statement_timeout='5s';
     ${nullStaffPersistSql}`,
    "concurrency:null-staff:b",
  );
  waitForActivity(
    "issue134_null_staff_second",
    ([, waitType, event]) => waitType === "Lock" && event === "advisory",
  );
  const nullStaffRace = await Promise.all([
    nullStaffFirst,
    nullStaffSecond,
  ]);
  captureConcurrency("same-operation-null-staff-appointment", nullStaffRace);
  requireStatuses("NULL-staff appointment race", nullStaffRace);
  const nullStaffRows = nullStaffRace.map(finalRow);
  const nullStaffOutcomes = nullStaffRows
    .map((row) => row.split("|")[0])
    .sort();
  const nullStaffAppointmentIds = nullStaffRows.map(
    (row) => row.split("|")[1],
  );
  if (
    JSON.stringify(nullStaffOutcomes) !==
      JSON.stringify(["CREATED", "EXISTING"]) ||
    !nullStaffAppointmentIds[0] ||
    nullStaffAppointmentIds[0] !== nullStaffAppointmentIds[1] ||
    sql(
      `select count(*) from public.appointments
       where booking_operation_id='${nullStaffOperation}'
         and staff_id is null`,
      { quiet: true, phase: "concurrency:null-staff:count" },
    ) !== "1"
  ) {
    throw new Error(`NULL-staff appointment race mismatch: ${nullStaffRows}`);
  }
  summary.concurrency.push("same-operation-null-staff-appointment");

  const closeOperation = "15800000-0000-4000-8000-000000000400";
  sql(
    `set role service_role; select public.issue134_bootstrap(
      '${closeOperation}','15800000-0000-4000-8000-000000000401',
      '15800000-0000-4000-8000-000000000040',
      'deposit','deposit',5000,'cash','manual')`,
    { quiet: true, phase: "fence:close-first:setup" },
  );
  const closeFirst = sqlAsync(
    `set application_name='issue134_close_first';
     begin; set local role service_role;
     select outcome from public.close_booking_operation_v1(
       '15800000-0000-4000-8000-000000000001','${closeOperation}',
       '15800000-0000-4000-8000-000000000002','SLOT_CONFLICT',
       null,null,false);
     select pg_catalog.pg_sleep(1.2); commit`,
    "fence:close-first:close",
  );
  waitForActivity(
    "issue134_close_first",
    ([, , event]) => event === "PgSleep",
  );
  const createAfterClose = sqlAsync(
    persistSql.replaceAll(
      "15800000-0000-4000-8000-000000000300",
      closeOperation,
    ),
    "fence:close-first:create",
  );
  const closeFirstResults = await Promise.all([closeFirst, createAfterClose]);
  captureConcurrency("close-before-create", closeFirstResults);
  if (
    closeFirstResults[0].status !== 0 ||
    closeFirstResults[1].status === 0 ||
    !closeFirstResults[1].stderr.includes("BOOKING_OPERATION_CLOSED")
  ) {
    throw new Error("close-before-create fence mismatch");
  }
  summary.concurrency.push("close-before-create");

  const createOperation = "15800000-0000-4000-8000-000000000500";
  sql(
    `set role service_role; select public.issue134_bootstrap(
      '${createOperation}','15800000-0000-4000-8000-000000000501',
      '15800000-0000-4000-8000-000000000040',
      'deposit','deposit',5000,'cash','manual')`,
    { quiet: true, phase: "fence:create-first:setup" },
  );
  const createFirst = sqlAsync(
    `set application_name='issue134_create_first';
     begin; set local role service_role;
     ${persistSql
       .replace("set role service_role;", "")
       .replaceAll(
         "15800000-0000-4000-8000-000000000300",
         createOperation,
       )};
     select pg_catalog.pg_sleep(1.2); commit`,
    "fence:create-first:create",
  );
  waitForActivity(
    "issue134_create_first",
    ([, , event]) => event === "PgSleep",
  );
  const closeAfterCreate = sqlAsync(
    `set role service_role;
     select outcome,appointment_id,recorded
     from public.close_booking_operation_v1(
       '15800000-0000-4000-8000-000000000001','${createOperation}',
       '15800000-0000-4000-8000-000000000002','SLOT_CONFLICT',
       null,null,false)`,
    "fence:create-first:close",
  );
  const createFirstResults = await Promise.all([createFirst, closeAfterCreate]);
  captureConcurrency("create-before-close", createFirstResults);
  requireStatuses("create-before-close", createFirstResults);
  if (!finalRow(closeAfterCreate).startsWith("RECOVERY_REQUIRED|")) {
    throw new Error("create-before-close did not preserve the winning appointment");
  }
  summary.concurrency.push("create-before-close");

  function setupBoundOperation(operationId, keyId) {
    const admitted = sql(
      `set role service_role; select public.issue134_bootstrap(
        '${operationId}','${keyId}',
        '15800000-0000-4000-8000-000000000040',
        'deposit','deposit',5000,'cash','manual')`,
      { quiet: true, phase: `fence:${operationId}:bootstrap` },
    );
    if (admitted !== "ADMITTED") {
      throw new Error(`Could not prepare fenced operation ${operationId}`);
    }
    const row = sql(
      persistSql.replaceAll(
        "15800000-0000-4000-8000-000000000300",
        operationId,
      ),
      { quiet: true, phase: `fence:${operationId}:persist` },
    );
    const preparedAppointmentId = row.split("|")[1];
    const preparedAttemptId = sql(
      `select id from public.commerce_payment_attempts
       where booking_operation_id='${operationId}'`,
      { quiet: true, phase: `fence:${operationId}:attempt` },
    );
    sql(
      `set role service_role;
       select outcome from public.bind_booking_operation_appointment_v1(
         '15800000-0000-4000-8000-000000000001','${operationId}',
         '15800000-0000-4000-8000-000000000002','${preparedAppointmentId}')`,
      { quiet: true, phase: `fence:${operationId}:bind` },
    );
    return {
      appointmentId: preparedAppointmentId,
      attemptId: preparedAttemptId,
    };
  }

  const commitFirstOperation = "15800000-0000-4000-8000-000000000600";
  const commitFirstFixture = setupBoundOperation(
    commitFirstOperation,
    "15800000-0000-4000-8000-000000000601",
  );
  const commitFirst = sqlAsync(
    `set application_name='issue134_commit_first';
     begin; set local role service_role;
     select outcome from public.commit_booking_operation_manual_payment_v1(
       '15800000-0000-4000-8000-000000000001','${commitFirstOperation}',
       '15800000-0000-4000-8000-000000000002',
       '${commitFirstFixture.attemptId}');
     select pg_catalog.pg_sleep(1.2); commit`,
    "fence:commit-first:commit",
  );
  waitForActivity(
    "issue134_commit_first",
    ([, , event]) => event === "PgSleep",
  );
  const cancelAfterCommit = sqlAsync(
    `set role service_role;
     select outcome,recorded from public.close_booking_operation_v1(
       '15800000-0000-4000-8000-000000000001','${commitFirstOperation}',
       '15800000-0000-4000-8000-000000000002','APPOINTMENT_CANCELLED',
       null,null,true)`,
    "fence:commit-first:close",
  );
  const commitFirstResults = await Promise.all([
    commitFirst,
    cancelAfterCommit,
  ]);
  captureConcurrency("commit-before-close", commitFirstResults);
  requireStatuses("commit-before-close", commitFirstResults);
  if (!finalRow(cancelAfterCommit).endsWith("|t")) {
    throw new Error("commit-before-close did not preserve recorded money");
  }
  summary.concurrency.push("commit-before-close");

  const closeFirstOperation = "15800000-0000-4000-8000-000000000700";
  const closeFirstFixture = setupBoundOperation(
    closeFirstOperation,
    "15800000-0000-4000-8000-000000000701",
  );
  const cancellationFirst = sqlAsync(
    `set application_name='issue134_cancellation_first';
     begin; set local role service_role;
     select outcome from public.close_booking_operation_v1(
       '15800000-0000-4000-8000-000000000001','${closeFirstOperation}',
       '15800000-0000-4000-8000-000000000002','APPOINTMENT_CANCELLED',
       null,null,true);
     select pg_catalog.pg_sleep(1.2); commit`,
    "fence:close-first:cancel",
  );
  waitForActivity(
    "issue134_cancellation_first",
    ([, , event]) => event === "PgSleep",
  );
  const commitAfterClose = sqlAsync(
    `set role service_role;
     select outcome,recorded from public.commit_booking_operation_manual_payment_v1(
       '15800000-0000-4000-8000-000000000001','${closeFirstOperation}',
       '15800000-0000-4000-8000-000000000002',
       '${closeFirstFixture.attemptId}')`,
    "fence:close-first:commit",
  );
  const closeBeforeCommitResults = await Promise.all([
    cancellationFirst,
    commitAfterClose,
  ]);
  captureConcurrency("close-before-commit", closeBeforeCommitResults);
  requireStatuses("close-before-commit", closeBeforeCommitResults);
  if (!finalRow(commitAfterClose).startsWith("NOT_COMMITTABLE|")) {
    throw new Error("close-before-commit did not fence the zero-ledger attempt");
  }
  summary.concurrency.push("close-before-commit");

  function exactRecoveryEvidence(operationId, phase) {
    return sql(
      `set role service_role;
       select
         payload->>'found',
         payload->'attempt'->>'execution_state',
         payload->>'appointment_count',
         payload->>'ledger_count',
         coalesce(payload->'attempt'->>'appointment_id','')
       from public.read_booking_operations_v1(
         '15800000-0000-4000-8000-000000000001',
         '15800000-0000-4000-8000-000000000002',
         'one','${operationId}',null,null,null,1
       )`,
      { quiet: true, phase },
    );
  }

  function assertRecoveryCounts(
    operationId,
    attemptKey,
    expectedAppointments,
    expectedLedgers,
    phase,
  ) {
    const counts = sql(
      `select
         (select count(*) from public.commerce_booking_operations
          where id='${operationId}'),
         (select count(*) from public.commerce_payment_attempts
          where booking_operation_id='${operationId}'
            and attempt_key='${attemptKey}'),
         (select count(*) from public.appointments
          where booking_operation_id='${operationId}'),
         (select count(*) from public.commerce_transactions transaction_row
          join public.commerce_payment_attempts attempt_row
            on attempt_row.id=transaction_row.payment_attempt_id
          where attempt_row.booking_operation_id='${operationId}')`,
      { quiet: true, phase },
    );
    const expected = `1|1|${expectedAppointments}|${expectedLedgers}`;
    if (counts !== expected) {
      throw new Error(
        `Recovery identity/count mismatch for ${operationId}: ${counts}`,
      );
    }
  }

  const bootstrapRecoveryOperation =
    "15800000-0000-4000-8000-000000000810";
  const bootstrapRecoveryKey = "15800000-0000-4000-8000-000000000811";
  await sqlLostResponse(
    `select public.issue134_bootstrap(
       '${bootstrapRecoveryOperation}','${bootstrapRecoveryKey}',
       '15800000-0000-4000-8000-000000000040',
       'deposit','deposit',5000,'cash','manual'
     )`,
    "issue134_lost_bootstrap_response",
    "recovery:bootstrap:lost-response",
  );
  const bootstrapEvidence = exactRecoveryEvidence(
    bootstrapRecoveryOperation,
    "recovery:bootstrap:canonical-read",
  );
  if (bootstrapEvidence !== "true|REQUESTED|0|0|") {
    throw new Error(
      `Bootstrap recovery evidence mismatch: ${bootstrapEvidence}`,
    );
  }
  assertRecoveryCounts(
    bootstrapRecoveryOperation,
    bootstrapRecoveryKey,
    0,
    0,
    "recovery:bootstrap:counts",
  );
  const bootstrapReplay = sql(
    `set role service_role;
     select public.issue134_bootstrap(
       '${bootstrapRecoveryOperation}','${bootstrapRecoveryKey}',
       '15800000-0000-4000-8000-000000000040',
       'deposit','deposit',5000,'cash','manual'
     )`,
    { quiet: true, phase: "recovery:bootstrap:replay" },
  );
  if (bootstrapReplay !== "EXISTING") {
    throw new Error(`Bootstrap recovery did not replay: ${bootstrapReplay}`);
  }
  summary.recovery.push({
    boundary: "bootstrap_committed",
    transportClassificationBeforeRead: "UNKNOWN",
    canonicalEvidence: bootstrapEvidence,
    sameIdentityReplay: bootstrapReplay,
    recollectionInvited: false,
  });

  const appointmentRecoveryOperation =
    "15800000-0000-4000-8000-000000000820";
  const appointmentRecoveryKey = "15800000-0000-4000-8000-000000000821";
  if (
    sql(
      `set role service_role;
       select public.issue134_bootstrap(
         '${appointmentRecoveryOperation}','${appointmentRecoveryKey}',
         '15800000-0000-4000-8000-000000000040',
         'deposit','deposit',5000,'cash','manual'
       )`,
      { quiet: true, phase: "recovery:appointment:bootstrap" },
    ) !== "ADMITTED"
  ) {
    throw new Error("Could not prepare appointment recovery operation");
  }
  await sqlLostResponse(
    persistSql
      .replace("set role service_role;", "")
      .replaceAll(
        "15800000-0000-4000-8000-000000000300",
        appointmentRecoveryOperation,
      ),
    "issue134_lost_appointment_response",
    "recovery:appointment:lost-response",
  );
  const appointmentEvidence = exactRecoveryEvidence(
    appointmentRecoveryOperation,
    "recovery:appointment:canonical-read",
  );
  const appointmentEvidenceParts = appointmentEvidence.split("|");
  if (
    appointmentEvidenceParts[0] !== "true" ||
    appointmentEvidenceParts[1] !== "REQUESTED" ||
    appointmentEvidenceParts[2] !== "1" ||
    appointmentEvidenceParts[3] !== "0" ||
    appointmentEvidenceParts[4] !== ""
  ) {
    throw new Error(
      `Appointment recovery evidence mismatch: ${appointmentEvidence}`,
    );
  }
  const recoveredAppointmentId = sql(
    `select id from public.appointments
     where booking_operation_id='${appointmentRecoveryOperation}'`,
    { quiet: true, phase: "recovery:appointment:id" },
  );
  const appointmentReplay = sql(
    persistSql.replaceAll(
      "15800000-0000-4000-8000-000000000300",
      appointmentRecoveryOperation,
    ),
    { quiet: true, phase: "recovery:appointment:replay" },
  );
  if (appointmentReplay !== `EXISTING|${recoveredAppointmentId}`) {
    throw new Error(
      `Appointment recovery did not replay the same row: ${appointmentReplay}`,
    );
  }
  assertRecoveryCounts(
    appointmentRecoveryOperation,
    appointmentRecoveryKey,
    1,
    0,
    "recovery:appointment:counts",
  );
  summary.recovery.push({
    boundary: "appointment_committed",
    transportClassificationBeforeRead: "UNKNOWN",
    canonicalEvidence: appointmentEvidence,
    sameIdentityReplay: appointmentReplay,
    recollectionInvited: false,
  });

  const bindRecoveryOperation = "15800000-0000-4000-8000-000000000830";
  const bindRecoveryKey = "15800000-0000-4000-8000-000000000831";
  if (
    sql(
      `set role service_role;
       select public.issue134_bootstrap(
         '${bindRecoveryOperation}','${bindRecoveryKey}',
         '15800000-0000-4000-8000-000000000040',
         'deposit','deposit',5000,'cash','manual'
       )`,
      { quiet: true, phase: "recovery:bind:bootstrap" },
    ) !== "ADMITTED"
  ) {
    throw new Error("Could not prepare bind recovery operation");
  }
  const bindAppointmentRow = sql(
    persistSql.replaceAll(
      "15800000-0000-4000-8000-000000000300",
      bindRecoveryOperation,
    ),
    { quiet: true, phase: "recovery:bind:persist" },
  );
  const bindAppointmentId = bindAppointmentRow.split("|")[1];
  await sqlLostResponse(
    `select outcome
     from public.bind_booking_operation_appointment_v1(
       '15800000-0000-4000-8000-000000000001',
       '${bindRecoveryOperation}',
       '15800000-0000-4000-8000-000000000002',
       '${bindAppointmentId}'
     )`,
    "issue134_lost_bind_response",
    "recovery:bind:lost-response",
  );
  const bindEvidence = exactRecoveryEvidence(
    bindRecoveryOperation,
    "recovery:bind:canonical-read",
  );
  if (
    bindEvidence !==
    `true|REQUESTED|1|0|${bindAppointmentId}`
  ) {
    throw new Error(`Bind recovery evidence mismatch: ${bindEvidence}`);
  }
  const bindReplay = sql(
    `set role service_role;
     select outcome,appointment_id
     from public.bind_booking_operation_appointment_v1(
       '15800000-0000-4000-8000-000000000001',
       '${bindRecoveryOperation}',
       '15800000-0000-4000-8000-000000000002',
       '${bindAppointmentId}'
     )`,
    { quiet: true, phase: "recovery:bind:replay" },
  );
  if (bindReplay !== `EXISTING|${bindAppointmentId}`) {
    throw new Error(`Bind recovery did not replay: ${bindReplay}`);
  }
  assertRecoveryCounts(
    bindRecoveryOperation,
    bindRecoveryKey,
    1,
    0,
    "recovery:bind:counts",
  );
  summary.recovery.push({
    boundary: "bind_committed",
    transportClassificationBeforeRead: "UNKNOWN",
    canonicalEvidence: bindEvidence,
    sameIdentityReplay: bindReplay,
    recollectionInvited: false,
  });

  const commitRecoveryOperation =
    "15800000-0000-4000-8000-000000000840";
  const commitRecoveryKey = "15800000-0000-4000-8000-000000000841";
  const commitRecoveryFixture = setupBoundOperation(
    commitRecoveryOperation,
    commitRecoveryKey,
  );
  await sqlLostResponse(
    `select outcome,transaction_id
     from public.commit_booking_operation_manual_payment_v1(
       '15800000-0000-4000-8000-000000000001',
       '${commitRecoveryOperation}',
       '15800000-0000-4000-8000-000000000002',
       '${commitRecoveryFixture.attemptId}'
     )`,
    "issue134_lost_commit_response",
    "recovery:commit:lost-response",
  );
  const commitEvidence = exactRecoveryEvidence(
    commitRecoveryOperation,
    "recovery:commit:canonical-read",
  );
  if (
    commitEvidence !==
    `true|ACCEPTED|1|1|${commitRecoveryFixture.appointmentId}`
  ) {
    throw new Error(`Commit recovery evidence mismatch: ${commitEvidence}`);
  }
  const commitReplay = sql(
    `set role service_role;
     select outcome,transaction_id
     from public.commit_booking_operation_manual_payment_v1(
       '15800000-0000-4000-8000-000000000001',
       '${commitRecoveryOperation}',
       '15800000-0000-4000-8000-000000000002',
       '${commitRecoveryFixture.attemptId}'
     )`,
    { quiet: true, phase: "recovery:commit:replay" },
  );
  const durableTransactionId = sql(
    `select transaction_row.id
     from public.commerce_transactions transaction_row
     join public.commerce_payment_attempts attempt_row
       on attempt_row.id=transaction_row.payment_attempt_id
     where attempt_row.booking_operation_id='${commitRecoveryOperation}'`,
    { quiet: true, phase: "recovery:commit:transaction-id" },
  );
  if (commitReplay !== `REPLAY|${durableTransactionId}`) {
    throw new Error(
      `Commit recovery did not replay the durable transaction: ${commitReplay}`,
    );
  }
  assertRecoveryCounts(
    commitRecoveryOperation,
    commitRecoveryKey,
    1,
    1,
    "recovery:commit:counts",
  );
  if (
    sql(
      `select count(*) from public.commerce_payment_reconciliation
       where attempt_id='${commitRecoveryFixture.attemptId}'`,
      { quiet: true, phase: "recovery:commit:obligations" },
    ) !== "4"
  ) {
    throw new Error("Commit recovery duplicated or lost obligations");
  }
  summary.recovery.push({
    boundary: "money_commit_committed",
    transportClassificationBeforeRead: "UNKNOWN",
    canonicalEvidence: commitEvidence,
    sameIdentityReplay: commitReplay,
    recollectionInvited: false,
  });

  const rollbackRecoveryOperation =
    "15800000-0000-4000-8000-000000000850";
  const rollbackRecoveryKey = "15800000-0000-4000-8000-000000000851";
  sql(
    `begin;
     set local role service_role;
     select public.issue134_bootstrap(
       '${rollbackRecoveryOperation}','${rollbackRecoveryKey}',
       '15800000-0000-4000-8000-000000000040',
       'deposit','deposit',5000,'cash','manual'
     );
     rollback`,
    { quiet: true, phase: "recovery:known-rollback" },
  );
  const rollbackCounts = sql(
    `select
       (select count(*) from public.commerce_booking_operations
        where id='${rollbackRecoveryOperation}'),
       (select count(*) from public.commerce_payment_attempts
        where booking_operation_id='${rollbackRecoveryOperation}'),
       (select count(*) from public.appointments
        where booking_operation_id='${rollbackRecoveryOperation}'),
       (select count(*) from public.commerce_transactions transaction_row
        join public.commerce_payment_attempts attempt_row
          on attempt_row.id=transaction_row.payment_attempt_id
        where attempt_row.booking_operation_id='${rollbackRecoveryOperation}')`,
    { quiet: true, phase: "recovery:known-rollback:counts" },
  );
  if (rollbackCounts !== "0|0|0|0") {
    throw new Error(`Known rollback left durable effects: ${rollbackCounts}`);
  }
  summary.recovery.push({
    boundary: "known_rollback",
    transportClassificationBeforeRead: "KNOWN_ROLLBACK",
    canonicalEvidence: "ABSENT",
    sameIdentityReplay: "NOT_RUN",
    recollectionInvited: false,
  });

  const revoked = spawnSync(
    binaries.psql,
    psqlArgs([
      "-c",
      `begin;
       update public.businesses
       set owner_id='15800000-0000-4000-8000-000000000099'
       where id='15800000-0000-4000-8000-000000000001';
       set local role service_role;
       select payload from public.read_booking_operations_v1(
         '15800000-0000-4000-8000-000000000001',
         '15800000-0000-4000-8000-000000000002',
         'one','15800000-0000-4000-8000-000000000300',
         null,null,null,1);
       rollback`,
    ]),
    { encoding: "utf8", stdio: "pipe", env: childEnv },
  );
  recordPhase(
    "authorization:revoked",
    revoked.status,
    revoked.error,
    revoked.stdout ?? "",
    revoked.stderr ?? "",
  );
  if (
    revoked.status === 0 ||
    !String(revoked.stderr).includes("BOOKING_OPERATION_NOT_AUTHORIZED")
  ) {
    throw new Error("Revoked actor did not receive generic authorization denial");
  }

  const finalCounts = sql(
    `select
       (select count(*) from public.commerce_booking_operations),
       (select count(*) from public.appointments where booking_operation_id is not null),
       (select count(*) from public.commerce_transactions where payment_attempt_id is not null),
       (select count(*) from public.commerce_payment_reconciliation)`,
    { quiet: true, phase: "reconcile:final-counts" },
  );
  summary.finalCounts = finalCounts;

  summary.sourceIdentityAfter = captureSourceIdentity();
  writeFileSync(
    sourceIdentityAfterPath,
    `${JSON.stringify(summary.sourceIdentityAfter, null, 2)}\n`,
    { flag: "wx", mode: 0o600 },
  );
  summary.sourceIdentityMatched =
    JSON.stringify(summary.sourceIdentityAfter) ===
    JSON.stringify(sourceIdentityBefore);
  if (!summary.sourceIdentityMatched) {
    throw new Error("Verifier source identity changed during execution");
  }
  passed = true;
  summary.passed = true;
  console.log("Issue #134 durable booking-operation PostgreSQL contract passed.");
} catch (error) {
  originalFailure = error;
  summary.originalFailure = {
    name: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
  };
}

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
    stopConfirmed = !status.error && status.status === 3;
    if (!stopConfirmed) {
      throw new Error(
        `Disposable PostgreSQL stop unconfirmed: stop=${stop.status}, status=${status.status}`,
      );
    }
  } else {
    stopConfirmed = true;
  }
  summary.stopConfirmed = stopConfirmed;

  if (existsSync(dataDir)) {
    if (!stopConfirmed) {
      throw new Error("Refusing PGDATA cleanup without confirmed stop");
    }
    const innerOwned =
      existsSync(markerPath) &&
      readFileSync(markerPath, "utf8").trim() === marker;
    const outerOwned =
      existsSync(ownershipMarkerPath) &&
      readFileSync(ownershipMarkerPath, "utf8").trim() === marker;
    if (!innerOwned || !outerOwned) {
      throw new Error("Refusing PGDATA cleanup: ownership marker mismatch");
    }
    rmSync(dataDir, { recursive: true });
  }
  summary.pgdataRemoved = !existsSync(dataDir);
} catch (error) {
  cleanupFailure = error;
  summary.cleanupFailure = {
    name: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
  };
  summary.passed = false;
}

summary.passed = passed && !cleanupFailure;
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, {
  mode: 0o600,
});

if (summary.pgdataRemoved) {
  console.log(
    `PASS confirmed stop and ownership marker cleanup; retained evidence: ${summaryPath}`,
  );
} else {
  console.error(
    `RETAINED owned PGDATA because cleanup was not confirmed; evidence: ${summaryPath}`,
  );
}

if (originalFailure) throw originalFailure;
if (cleanupFailure) throw cleanupFailure;
