// Test infrastructure only. No supplied connection, migration, or provider adapter.
import { spawn, spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync, closeSync, existsSync, lstatSync, mkdirSync, mkdtempSync,
  openSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(REPO, "tests/postgres/p2b1");
export const BIN = "/opt/homebrew/opt/postgresql@17/bin";
const ADMIN = "p2b1_admin";
const PORT = "55432"; // Unique private socket directory; never a TCP listener.
const owned = new WeakMap();
const MIGRATION = "supabase/migrations/20260927043000_issue_112_p2b1_subscription_authority.sql";
const VERIFICATION = "tests/postgres/p2b1/full-verification.mjs";

export function validateRequest(args, env) {
  if (args.length !== 1 || !["--baseline-only", "--full-verification"].includes(args[0])) {
    throw new Error("Exactly --baseline-only or --full-verification is required. Supplied targets, URLs, paths and other arguments are forbidden.");
  }
  // Reject names, even if empty; never echo potentially secret values.
  if (Object.keys(env).some((key) => /^PG/i.test(key) ||
      /DATABASE|POSTGRES|SUPABASE|(?:^|_)DB(?:_|$)/i.test(key))) {
    throw new Error("Conflicting database environment settings are forbidden; use a clean environment. No values were read or logged.");
  }
  return args[0].slice(2);
}

function statIdentity(path) {
  const stat = lstatSync(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== process.getuid() ||
      (stat.mode & 0o777) !== 0o700 || realpathSync(path) !== path) {
    throw new Error("Owned directory identity/permissions mismatch; refusing action.");
  }
  return `${stat.dev}:${stat.ino}`;
}

export function assertSocketPath(path) {
  if (Buffer.byteLength(join(path, `.s.PGSQL.${PORT}`)) > 100) {
    throw new Error("Unix socket path too long; use a short os.tmpdir() before launching.");
  }
}

export function createOwnedRun() {
  const parent = realpathSync(tmpdir());
  // This is the only source of a cluster target. No resume/adopt/attach API.
  const root = mkdtempSync(join(parent, "p2b1-"));
  chmodSync(root, 0o700);
  const run = Object.freeze({
    root, data: join(root, "data"), socket: join(root, "s"),
    marker: randomUUID(), database: `p2b1_${randomUUID().replaceAll("-", "")}`,
  });
  const state = { inode: statIdentity(root), child: null, exited: false, systemId: null };
  owned.set(run, state);
  try {
    writeFileSync(join(root, "owner.json"), JSON.stringify(run), { flag: "wx", mode: 0o600 });
    const markerStat = lstatSync(join(root, "owner.json"));
    state.markerInode = `${markerStat.dev}:${markerStat.ino}`;
    assertSocketPath(run.socket);
    mkdirSync(run.socket, { mode: 0o700 });
    state.socketInode = statIdentity(run.socket);
    return run;
  } catch (error) {
    // The freshly created directory has no process or caller-supplied contents.
    removeOwnedRun(run);
    throw error;
  }
}

export function assertOwnedRun(run) {
  const state = owned.get(run);
  if (!state || statIdentity(run.root) !== state.inode) {
    throw new Error("Unowned or changed task directory; refusing action.");
  }
  const markerStat = lstatSync(join(run.root, "owner.json"));
  if (!markerStat.isFile() || markerStat.isSymbolicLink() ||
      `${markerStat.dev}:${markerStat.ino}` !== state.markerInode ||
      readFileSync(join(run.root, "owner.json"), "utf8") !== JSON.stringify(run)) {
    throw new Error("Unowned or changed task directory; refusing action.");
  }
  if (state.socketInode && statIdentity(run.socket) !== state.socketInode) {
    throw new Error("Socket directory changed; refusing action.");
  }
  if (state.dataInode && statIdentity(run.data) !== state.dataInode) {
    throw new Error("Cluster directory changed; refusing action.");
  }
  return state;
}

export function removeOwnedRun(run) {
  const state = assertOwnedRun(run);
  if (state.child && !state.exited) throw new Error("Refusing cleanup while owned server may be running.");
  rmSync(run.root, { recursive: true, force: false });
  owned.delete(run);
}

export function psqlArgs(run, database = run.database) {
  assertOwnedRun(run);
  if (![run.database, "postgres"].includes(database)) throw new Error("Foreign database forbidden.");
  return ["-X", "--no-password", "--host", run.socket, "--port", PORT,
    "--username", ADMIN, "--dbname", database, "--set", "ON_ERROR_STOP=1", "--no-psqlrc"];
}

function childEnv() {
  // No inherited libpq, loader, shell, credential or application environment.
  return { PATH: `${BIN}:/usr/bin:/bin`, LANG: "C", LC_ALL: "C",
    PGPASSFILE: "/dev/null", PGSERVICEFILE: "/dev/null", PGSYSCONFDIR: "/dev/null" };
}

function command(name, args, input, logPath) {
  if (!["initdb", "pg_controldata", "psql"].includes(name)) throw new Error("Unapproved binary.");
  const result = spawnSync(join(BIN, name), args, {
    shell: false, env: childEnv(), cwd: REPO, input, encoding: "utf8",
    timeout: 30_000, maxBuffer: 4 * 1024 * 1024,
  });
  if (logPath) writeFileSync(logPath, (result.stdout ?? "") + (result.stderr ?? ""), { flag: "wx", mode: 0o600 });
  if (result.error || result.status !== 0) {
    // Only fixed, synthetic SQL is ever sent; no raw external payloads exist.
    throw new Error(`${name} failed (${result.error?.code ?? result.status}): ${result.stderr ?? ""}`);
  }
  return result.stdout + result.stderr; // Retain observed-role NOTICE evidence too.
}

const sqlLiteral = (value) => `'${value.replaceAll("'", "''")}'`;

export function identitySQL(run, systemId, database = run.database) {
  psqlArgs(run, database); // Also refuses forged/unowned targets.
  if (!/^\d+$/.test(systemId)) throw new Error("Missing cluster system identifier.");
  return `select (
    current_database() = ${sqlLiteral(database)}
    and session_user = '${ADMIN}' and current_user = '${ADMIN}'
    and current_setting('server_version_num')::int between 170000 and 179999
    and current_setting('data_directory') = ${sqlLiteral(run.data)}
    and current_setting('unix_socket_directories') = ${sqlLiteral(run.socket)}
    and current_setting('listen_addresses') = ''
    and current_setting('port') = '${PORT}'
    and current_setting('p2b1.run_marker', true) = ${sqlLiteral(run.marker)}
    and inet_server_addr() is null and inet_client_addr() is null
    and (select system_identifier::text from pg_control_system()) = '${systemId}'
  ) as p2b1_identity_ok \\gset
\\if :p2b1_identity_ok
\\else
  \\echo 'REFUSED: database / marker / local cluster identity mismatch'
  select 1 / 0; -- ON_ERROR_STOP gives nonzero exit on PostgreSQL 17 psql.
\\endif
set statement_timeout = '10s';
set lock_timeout = '3s';
set row_security = on;
`;
}

export function loadFixtures() {
  const provenance = JSON.parse(readFileSync(join(FIXTURES, "provenance.json"), "utf8"));
  const loaded = new Map();
  for (const entry of [...provenance.sources, ...provenance.fixtures]) {
    const path = resolve(REPO, entry.path);
    if (!path.startsWith(`${REPO}/`) || realpathSync(path) !== path || !lstatSync(path).isFile()) {
      throw new Error("Source/fixture must be a regular file inside this checkout.");
    }
    const data = readFileSync(path);
    if (createHash("sha256").update(data).digest("hex") !== entry.sha256) {
      throw new Error(`Source/fixture hash changed: ${entry.path}; inspect provenance before running.`);
    }
    loaded.set(entry.path, data.toString("utf8"));
  }
  const names = ["baseline.sql", "baseline-contract.sql", "historical-037.sql", "historical-038.sql", "overlay-contract.sql"];
  return Object.fromEntries(names.map((name) => {
    const sql = loaded.get(`tests/postgres/p2b1/${name}`);
    if (!sql) throw new Error(`Missing reviewed fixture: ${name}`);
    return [name, sql];
  }));
}

export function loadFullInputs() {
  const provenance = JSON.parse(readFileSync(join(FIXTURES, "full-provenance.json"), "utf8"));
  if (provenance.version !== 1) throw new Error("Unsupported full-verification provenance version.");
  const loaded = {};
  for (const [key, expected] of [["migration", MIGRATION], ["verification", VERIFICATION]]) {
    const entry = provenance[key];
    if (entry?.path !== expected || !/^[a-f0-9]{64}$/.test(entry?.sha256 ?? "")) {
      throw new Error("Full-verification provenance must contain the exact reviewed input inventory.");
    }
    const path = resolve(REPO, expected);
    if (realpathSync(path) !== path || !lstatSync(path).isFile()) {
      throw new Error("Full-verification input must be a regular in-checkout file without symlinks.");
    }
    const data = readFileSync(path);
    if (createHash("sha256").update(data).digest("hex") !== entry.sha256) {
      throw new Error(`Full-verification hash changed: ${expected}; inspect provenance before running.`);
    }
    loaded[key] = data.toString("utf8");
  }
  // The fixed suite uses only node: imports; execute the exact bytes just hashed.
  // Relative application imports are deliberately unavailable at this boundary.
  return loaded;
}

function createEvidence() {
  // Evidence is deliberately outside the directory removed by cluster cleanup.
  let directory = REPO;
  for (const part of ["test-results", "issue-112"]) {
    directory = join(directory, part);
    if (!existsSync(directory)) mkdirSync(directory, { mode: 0o700 });
    if (realpathSync(directory) !== directory || !lstatSync(directory).isDirectory()) {
      throw new Error("Evidence path must be an in-checkout directory, without symlinks.");
    }
  }
  return mkdtempSync(join(directory, "disposable-"));
}

async function runDisposable({ fixtures, full, overlay = false }) {
  const evidence = createEvidence();
  const run = createOwnedRun();
  const state = assertOwnedRun(run);
  const report = { run, evidence, directoryInode: state.inode, startedAt: new Date().toISOString(),
    scope: full ? `FULL P2B-1 SYNTHETIC VERIFICATION; HISTORICAL OVERLAYS ${overlay ? "PRESENT" : "ABSENT"}` :
      "PRE-CORRECTION BASELINE ONLY; NOT A SECURITY PASS", phases: [], result: "FAILED" };
  writeFileSync(join(evidence, "ownership.json"), JSON.stringify(report, null, 2));
  let logFd;
  let interrupted = false;
  const interrupt = () => { interrupted = true; };
  const checkInterrupted = () => { if (interrupted) throw new Error("Interrupted; stopping own disposable instance."); };
  process.on("SIGINT", interrupt);
  process.on("SIGTERM", interrupt);
  const pendingQueries = new Set();
  let queryNumber = 0;
  function phase(name, sql, { database = run.database, transaction = true } = {}) {
    checkInterrupted();
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) throw new Error("Invalid evidence phase name.");
    assertOwnedRun(run);
    if (state.exited) throw new Error("Owned server exited before fixture phase.");
    const identity = identitySQL(run, state.systemId, database);
    // Identity and fixture share ONE connection. Never use \connect or supplied SQL.
    command("psql", psqlArgs(run, database),
      identity + (transaction ? `begin;\n${sql}\ncommit;\n` : sql), join(evidence, `${name}.log`));
    report.phases.push(name);
  }
  function query(sql) {
    checkInterrupted();
    assertOwnedRun(run);
    if (state.exited) throw new Error("Owned server exited before verification query.");
    const input = identitySQL(run, state.systemId) + sql;
    const logName = `query-${String(++queryNumber).padStart(4, "0")}.log`;
    const promise = new Promise((resolveQuery, rejectQuery) => {
      const child = spawn(join(BIN, "psql"), [...psqlArgs(run), "--tuples-only", "--no-align", "--quiet"], {
        shell: false, env: childEnv(), cwd: REPO, stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "", stderr = "", failed;
      const timer = setTimeout(() => {
        failed = new Error("Verification query timed out.");
        child.kill("SIGTERM");
      }, 30_000);
      const capture = (stream) => (chunk) => {
        if (stream === "stdout") stdout += chunk;
        else stderr += chunk;
        if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 4 * 1024 * 1024) {
          failed = new Error("Verification query exceeded bounded output.");
          child.kill("SIGTERM");
        }
      };
      child.stdout.setEncoding("utf8").on("data", capture("stdout"));
      child.stderr.setEncoding("utf8").on("data", capture("stderr"));
      child.on("error", (error) => { failed = error; });
      child.stdin.on("error", (error) => { failed ??= error; });
      child.once("close", (code) => {
        clearTimeout(timer);
        writeFileSync(join(evidence, logName), stdout + stderr, { flag: "wx", mode: 0o600 });
        if (failed || code !== 0) rejectQuery(new Error(`psql verification failed (${failed?.message ?? code}): ${stderr}`));
        else resolveQuery({ stdout, stderr });
      });
      child.stdin.end(input);
    });
    pendingQueries.add(promise);
    promise.then(() => pendingQueries.delete(promise), () => pendingQueries.delete(promise));
    return promise;
  }
  async function concurrent(statements) {
    // Settle every connection before surfacing a failure or cleaning up its cluster.
    const results = await Promise.allSettled(statements.map((sql) => query(sql)));
    const failed = results.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
    return results.map((result) => result.value);
  }
  try {
    command("initdb", ["--pgdata", run.data, "--username", ADMIN,
      "--auth-local=trust", "--auth-host=reject", "--encoding=UTF8", "--locale=C", "--no-instructions"],
    undefined, join(evidence, "initdb.log"));
    state.dataInode = statIdentity(run.data);
    state.systemId = command("pg_controldata", [run.data]).match(/^Database system identifier:\s+(\d+)$/m)?.[1];
    if (!state.systemId) throw new Error("Could not identify initialized cluster.");
    // All options are separate exec argv. No pg_ctl shell command or external config.
    const serverArgs = ["-D", run.data, "-k", run.socket, "-p", PORT,
      "-c", "listen_addresses=", "-c", "unix_socket_permissions=0700",
      "-c", `p2b1.run_marker=${run.marker}`, "-c", "max_connections=10"];
    logFd = openSync(join(evidence, "postgres.log"), "wx", 0o600);
    checkInterrupted();
    state.child = spawn(join(BIN, "postgres"), serverArgs, {
      shell: false, env: childEnv(), cwd: run.root, stdio: ["ignore", logFd, logFd],
      detached: false,
    });
    let spawnError;
    const exited = new Promise((resolveExit) => {
      state.child.once("error", (error) => { spawnError = error; state.exited = true; resolveExit(); });
      state.child.once("exit", () => { state.exited = true; resolveExit(); });
    });
    state.exitPromise = exited;
    report.pid = state.child.pid;
    report.systemId = state.systemId;
    writeFileSync(join(evidence, "ownership.json"), JSON.stringify(report, null, 2));
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      checkInterrupted();
      if (state.exited) throw new Error(`Owned PostgreSQL exited during startup (${spawnError?.code ?? "see postgres.log"}).`);
      if (existsSync(join(run.socket, `.s.PGSQL.${PORT}`)) && existsSync(join(run.data, "postmaster.pid"))) {
        const lines = readFileSync(join(run.data, "postmaster.pid"), "utf8").split("\n");
        if (lines[0] === String(state.child.pid) && lines[1] === run.data && lines[7]?.trim() === "ready") {
          ready = true; break;
        }
      }
      await delay(100);
    }
    if (!ready) throw new Error("Owned PostgreSQL startup timed out.");
    const pidFile = readFileSync(join(run.data, "postmaster.pid"), "utf8").split("\n");
    if (pidFile[0] !== String(state.child.pid) || pidFile[1] !== run.data) {
      throw new Error("Postmaster identity mismatch.");
    }
    phase("00-create-task-database", `create database "${run.database}";`, { database: "postgres", transaction: false });
    phase("01-baseline", fixtures["baseline.sql"]);
    phase("02-without-overlay", fixtures["baseline-contract.sql"], { transaction: false });
    if (!full || overlay) {
      phase("03-historical-037", fixtures["historical-037.sql"]);
      phase("04-historical-038", fixtures["historical-038.sql"]);
      phase("05-with-overlay", fixtures["baseline-contract.sql"], { transaction: false });
      phase("06-overlay-contract", fixtures["overlay-contract.sql"], { transaction: false });
    }
    if (full) {
      // Exact access-flag definition from 032; the preserved baseline excerpt omitted it.
      phase("full-baseline-access-flag", "alter table public.businesses add column private_alpha_enabled boolean not null default false;");
      phase("07-p2b1-migration", full.migration);
      phase("08-p2b1-migration-repeat", full.migration);
      report.verification = await full.verify({ phase, query, concurrent, overlay, fixtures, migration: full.migration });
      if (!Number.isInteger(report.verification?.assertions) || report.verification.assertions < 1) {
        throw new Error("Full verification must report a positive assertion count; empty/skipped suites cannot pass.");
      }
      report.result = "FULL P2B-1 SYNTHETIC VERIFICATION PASSED";
    } else {
      report.result = "BASELINE OBSERVED; EXISTING AUTHORITY GAPS; NOT A SECURITY PASS";
    }
  } catch (error) {
    report.error = error.message;
    throw error;
  } finally {
    try {
      await Promise.allSettled([...pendingQueries]);
      assertOwnedRun(run);
      if (state.child && !state.exited) {
        // Signal only the direct ChildProcess this invocation actually spawned.
        state.child.kill("SIGINT"); // PostgreSQL fast shutdown; no unrelated PID lookup.
        const timeout = new AbortController();
        try { await Promise.race([state.exitPromise, delay(10_000, undefined, { signal: timeout.signal })]); }
        finally { timeout.abort(); }
        if (!state.exited) throw new Error("Own server did not exit; preserving cluster, no forced cleanup.");
      }
      removeOwnedRun(run);
      report.cleanup = "Exact self-created cluster removed; external evidence retained.";
    } catch (error) {
      report.cleanup = `REFUSED / PRESERVED: ${error.message}`;
      report.result = "FAILED";
      process.exitCode = 1;
    } finally {
      if (logFd !== undefined) closeSync(logFd);
      process.off("SIGINT", interrupt);
      process.off("SIGTERM", interrupt);
      report.finishedAt = new Date().toISOString();
      writeFileSync(join(evidence, "result.json"), JSON.stringify(report, null, 2));
      console.log(`${report.result}\nEvidence: ${evidence}`);
    }
  }
}

async function runRequested(mode) {
  const fixtures = loadFixtures(); // Validate bytes before creating/spawning anything.
  if (mode === "baseline-only") return runDisposable({ fixtures });
  const full = loadFullInputs();
  const suite = await import(`data:text/javascript;base64,${Buffer.from(full.verification).toString("base64")}`);
  if (typeof suite.verify !== "function") throw new Error("Full verification must export verify().");
  full.verify = suite.verify;
  // A fresh cluster per shape keeps roles, state and prior test effects isolated.
  await runDisposable({ fixtures, full, overlay: false });
  await runDisposable({ fixtures, full, overlay: true });
}

// Injection is solely an offline unit-test seam: rejected requests cannot reach execution.
export async function main(args = process.argv.slice(2), env = process.env, execute = runRequested) {
  const mode = validateRequest(args, env);
  await execute(mode);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
