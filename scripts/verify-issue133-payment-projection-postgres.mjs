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
    "Usage: node scripts/verify-issue133-payment-projection-postgres.mjs --confirm-disposable-local",
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
  "supabase/migrations/20261008210359_issue_133_payment_projection_observability.sql",
  "lib/commerce/payment-projections/types.ts",
  "lib/commerce/payment-projections/kernel.ts",
  "lib/commerce/payment-projections/index.ts",
  "lib/commerce/payment-observability/types.ts",
  "lib/commerce/payment-observability/reader.ts",
  "lib/commerce/payment-observability/index.ts",
  "tests/unit/commerce/payment-projection-kernel.test.ts",
  "tests/unit/commerce/payment-projection-admission.test.ts",
  "tests/unit/commerce/payment-observability-reader.test.ts",
  "tests/unit/migrations/issue133-payment-projection-observability.test.ts",
  "tests/postgres/issue-133-payment-projection-observability-contract.sql",
  "scripts/verify-issue133-payment-projection-postgres.mjs",
  "docs/reviews/issue-133-projection-observability-implementation.md",
  "docs/CHANGELOG.md",
  "docs/reviews/issue-133-projection-observability-contract.md",
  "docs/reviews/issue-133-r1a-projection-replay-amendment.md",
  "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql",
  "tests/postgres/issue-134-r1a-manual-kernel-contract.sql"
];
const acceptedSources = {
  "tests/postgres/issue-134-r1a-manual-kernel-contract.sql": "7d343b902711e264c3c2bbc15695ba092f983b88b84d9bdf9a4580b1652f2f23",
  "tests/postgres/issue-134-payment-attempt-foundation-fixture.sql": "29269eb09118ee941ca36e6372caa8ce49cb2e937b42cb7e868bbcf9595219e1",
  "supabase/migrations/20261007203352_issue_134_durable_booking_operation.sql": "01b10f8c629cc73b08d6c5849160836b90cbc87beb29d7c8b78857375fe2493b",
  "supabase/migrations/20261004190341_issue_134_payment_attempt_foundation.sql":
    "dee700ae7622afbcc91adf753b3fa559018ed9909f01cba2dc510db0a1ee3a47",
  "supabase/migrations/20261005154345_issue_134_r1a_manual_payment_kernel.sql":
    "4b7e38553eca69e039ef57e94b1e7201cfbad22e5beac4398db66cc94bad5ee7",
  "supabase/migrations/20261007012529_issue_134_appointment_financial_attribution.sql":
    "fd673cbf7ff5874000bb2272ab3db261193972b4c5437d54c58fc0c4333e7524",
};
const evidenceDir = mkdtempSync(
  join(tmpdir(), "chasum-issue133-projection-evidence-"),
);
const privateHome = join(evidenceDir, "home");
const privatePgpass = join(privateHome, ".pgpass");
const privateServiceFile = join(privateHome, "pg_service.conf");
const dataDir = join(evidenceDir, "pgdata");
const markerPath = join(dataDir, ".chasum-issue133-projection-disposable");
const ownershipMarkerPath = join(evidenceDir, "ownership-marker");
const serverLog = join(evidenceDir, "postgres.log");
const phaseLogPath = join(evidenceDir, "phases.jsonl");
const concurrencyPath = join(evidenceDir, "concurrency-responses.json");
const summaryPath = join(evidenceDir, "summary.json");
const sourceIdentityBeforePath = join(evidenceDir, "source-identity-before.json");
const sourceIdentityAfterPath = join(evidenceDir, "source-identity-after.json");
const marker = `issue133-projection-${randomBytes(16).toString("hex")}`;
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
  const status = spawnSync("/usr/bin/git", ["status", "--porcelain", "--untracked-files=all"], { cwd: root, encoding: "utf8", env: childEnv });
  if (status.status !== 0 || status.stdout.trim()) throw new Error("Refusing a dirty proof candidate");
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
    timeout: 120_000,
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
    "issue133_projection",
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    ...extra,
  ];
}

function sql(statement, options = {}) {
  return finalRow(command(
    binaries.psql,
    psqlArgs(["-At", "-F", "|", "-c", statement]),
    { ...options, phase: options.phase ?? "sql" },
  ));
}

function startSqlAsync(statement, phase, { discardOutput = false } = {}) {
  const child = spawn(
    binaries.psql,
    psqlArgs(["-At", "-F", "|", "-c", statement]),
    { stdio: ["ignore", "pipe", "pipe"], env: childEnv, timeout: 60_000, killSignal: "SIGKILL" },
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
  // psql -At still emits command tags, including after a result (COMMIT).
  // Ignore only known standalone tags; keep wrong/unknown business outcomes.
  return result.stdout.trim().split(/\r?\n/)
    .filter((line) => line && !/^(?:SET|RESET|BEGIN|COMMIT|ROLLBACK|UPDATE \d+)$/.test(line))
    .at(-1) ?? "";
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
    ["-h", "127.0.0.1", "-p", String(port), "-U", user, "issue133_projection"],
    { quiet: true, phase: "fixture:createdb" },
  );
  command(binaries.createdb,["-h","127.0.0.1","-p",String(port),"-U",user,"issue133_duplicate"],{phase:"duplicate:createdb",quiet:true});
  const duplicate=spawnSync(binaries.psql,psqlArgs(["-d","issue133_duplicate","-v","issue133_duplicate_preflight=1","-f",resolve(root,"tests/postgres/issue-133-payment-projection-observability-contract.sql")]),{encoding:"utf8",env:childEnv,stdio:"pipe",timeout:120_000});
  recordPhase("duplicate:migration-rejected",duplicate.status,duplicate.error,duplicate.stdout??"",duplicate.stderr??"");
  if(duplicate.error || duplicate.status===0 || !duplicate.stderr.includes("commerce_invoices_projection_appointment_key")) throw new Error("Historical duplicate invoice did not fail migration");
  const duplicateState=command(binaries.psql,psqlArgs(["-d","issue133_duplicate","-At","-c","select to_regclass('public.commerce_projection_admission') is null and not exists(select 1 from pg_attribute where attrelid='public.customer_payment_events'::regclass and attname='transaction_id' and not attisdropped)"]),{phase:"duplicate:rollback",quiet:true}).stdout.trim();
  if(duplicateState!=="t") throw new Error("Failed migration left partial schema");
  const contract = command(binaries.psql, psqlArgs(["-f", resolve(root, "tests/postgres/issue-133-payment-projection-observability-contract.sql")]), { phase: "fixture:contract" });
  if (!contract.stdout.includes("ISSUE133_SQL_CONTRACT_PASS") || !contract.stdout.includes("ISSUE133_FIXTURE_READY")) throw new Error("Incomplete SQL contract");
  summary.fixtureSetup = "PASS";
  const business = "13410000-0000-4000-8000-000000000011";
  const other = "13410000-0000-4000-8000-000000000012";
  const attempt = n => `(select attempt_id from public.issue133_ids where n=${n})`;
  for (const [kind,n] of [["appointment_cache",10],["invoice_settlement",11],["customer_payment_events",12],["receipt",13]]) {
    const call = `select public.project_payment_${kind}_v1('${business}',${attempt(n)})`;
    const first = startSqlAsync(`set application_name='issue133_first'; begin; set local role service_role; ${call}; select pg_sleep(1); commit`, `race:${kind}:first`);
    waitForActivity("issue133_first", ([,,event]) => event === "PgSleep");
    const second = startSqlAsync(`set application_name='issue133_second'; set role service_role; ${call}`, `race:${kind}:second`);
    waitForActivity("issue133_second", ([,type]) => type === "Lock");
    const results = await Promise.all([first.completion,second.completion]);
    requireStatuses(kind,results); captureConcurrency(kind,results);
    if (!results[0].stdout.includes('"outcome": "APPLIED"') || !results[1].stdout.includes('"outcome": "VERIFIED"')) throw new Error(`Race outcomes failed: ${kind}`);
    const check = sql(`select count(*)=1 from public.commerce_payment_reconciliation where attempt_id=${attempt(n)} and projection_kind='${kind}' and state='COMPLETE'`);
    if(check!=="t") throw new Error(`One COMPLETE identity failed: ${kind}`);
    summary.concurrency.push(kind);
  }
  for (const [kind,firstN,secondN] of [["invoice_settlement",51,52],["receipt",53,54]]) {
    const sequence = kind === "receipt" ? "commerce_receipt_sequences" : "commerce_invoice_sequences";
    if(sql(`select count(*) from public.${sequence} where business_id='${other}'`)!=="0") throw new Error("First-row sequence fixture is not empty");
    const first = startSqlAsync(`set application_name='issue133_seq_first'; begin; set local role service_role; select public.project_payment_${kind}_v1('${other}',${attempt(firstN)}); select pg_sleep(1); commit`, `sequence:${kind}:first`);
    waitForActivity("issue133_seq_first", ([,,event])=>event==="PgSleep");
    const second = startSqlAsync(`set application_name='issue133_seq_second'; set role service_role; select public.project_payment_${kind}_v1('${other}',${attempt(secondN)})`, `sequence:${kind}:second`);
    waitForActivity("issue133_seq_second", ([,type])=>type==="Lock");
    const results=await Promise.all([first.completion,second.completion]);requireStatuses(kind,results);captureConcurrency(`sequence:${kind}`,results);
    if(results.some(r=>!r.stdout.includes('"outcome": "APPLIED"'))) throw new Error(`First-row allocation failed: ${kind}`);
    const target=kind==="receipt"?"commerce_receipts":"commerce_invoices";
    const number=kind==="receipt"?"receipt_number":"invoice_number";
    if(sql(`select count(*)=2 and count(distinct ${number})=2 from public.${target} where business_id='${other}'`)!=="t" || sql(`select count(*)=1 and min(next_number)=3 from public.${sequence} where business_id='${other}'`)!=="t") throw new Error(`Sequence identity/allocation mismatch: ${kind}`);
    summary.concurrency.push(`first-row:${kind}`);
  }
  for (const [kind,n,target,identity] of [["receipt",14,"commerce_receipts","receipt_number"],["invoice_settlement",15,"commerce_invoices","invoice_number"],["customer_payment_events",16,"customer_payment_events","transaction_id::text"]]) {
    await sqlLostResponse(`select public.project_payment_${kind}_v1('${business}',${attempt(n)})`, "issue133_lost_projection", `lost-response:${kind}`);
    const predicate=kind==="invoice_settlement"?`appointment_id=(select appointment_id from public.issue133_ids where n=${n})`:`transaction_id=(select id from public.commerce_transactions where payment_attempt_id=${attempt(n)})`;
    const before=sql(`select id::text||'|'||${identity} from public.${target} where ${predicate}`);
    const replay=sql(`set role service_role; select public.project_payment_${kind}_v1('${business}',${attempt(n)})->>'outcome'`);
    const after=sql(`select id::text||'|'||${identity} from public.${target} where ${predicate}`);
    if(!before || before!==after || replay!=="VERIFIED") throw new Error(`Lost-response identity changed: ${kind}`);
    summary.recovery.push({boundary:`${kind}_committed`,before,after,replay});
  }
  const identityAfter=captureSourceIdentity();summary.sourceIdentityAfter=identityAfter;
  writeFileSync(sourceIdentityAfterPath,JSON.stringify(identityAfter,null,2)+"\n",{mode:0o600});
  if(JSON.stringify(sourceIdentityBefore)!==JSON.stringify(identityAfter)) throw new Error("Source identity changed during proof");
  summary.sourceIdentityMatched=true;
  passed=true;
  console.log("ISSUE133_POSTGRES_PROOF_PASS");
} catch (error) {
  originalFailure = error;
  summary.originalFailure = {
    name: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
  };
}

// Retain after-identity evidence even when a proof phase failed.
if (!summary.sourceIdentityAfter) {
  try {
    summary.sourceIdentityAfter = captureSourceIdentity();
    summary.sourceIdentityMatched = JSON.stringify(sourceIdentityBefore) === JSON.stringify(summary.sourceIdentityAfter);
    writeFileSync(sourceIdentityAfterPath, JSON.stringify(summary.sourceIdentityAfter, null, 2) + "\n", { mode: 0o600 });
  } catch (error) {
    recordPhase("source:after-failure", 1, error);
  }
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
