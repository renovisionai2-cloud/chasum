// Offline tests only: NEVER starts initdb, postgres, psql, or any network client.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, existsSync, lstatSync, mkdirSync, readFileSync,
  renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertOwnedRun, assertSocketPath, BIN, BLOCKED, createOwnedRun,
  identitySQL, loadFixtures, main, psqlArgs, removeOwnedRun, validateRequest,
} from "../../../scripts/verify-p2b1-disposable-postgres.mjs";

const script = fileURLToPath(new URL("../../../scripts/verify-p2b1-disposable-postgres.mjs", import.meta.url));

for (const args of [[], ["postgresql://user:secret@host.example/db"],
  ["--baseline-only", "postgresql://localhost/postgres"],
  ["--baseline-only", "--database-url=postgresql://host.example/db"],
  ["--baseline-only", "--host=/tmp"], ["--baseline-only", "--dbname=postgres"],
  ["--baseline-only", "--data-directory=/existing"],
  ["--baseline-only", "--bin=/foreign"], ["--baseline-only", "--baseline-only"],
  ["--full-verification", "--allow-blocked"], ["--baseline-only;touch /tmp/no"]]) {
  test(`reject supplied/default/foreign arguments: ${JSON.stringify(args).replaceAll("secret", "REDACTED")}`, async () => {
    let executed = 0;
    await assert.rejects(main(args, {}, () => { executed++; }), /forbidden|required/);
    assert.equal(executed, 0, "no runtime execution/spawn reached");
  });
}

for (const key of ["PGHOST", "PGHOSTADDR", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD",
  "PGPASSFILE", "PGSERVICE", "PGSERVICEFILE", "PGSYSCONFDIR", "PGOPTIONS", "PGDATA",
  "PGSSLMODE", "PGCLUSTER", "DATABASE_URL", "DIRECT_URL_DATABASE", "STAGE1B_DATABASE_URL",
  "POSTGRES_URL", "SUPABASE_DB_URL", "NEXT_PUBLIC_SUPABASE_URL", "DB_HOST", "pgHost"]) {
  test(`reject conflicting environment before execution: ${key}`, async () => {
    for (const value of ["", "localhost", "/tmp", "postgresql://user:do-not-log@host.example/db"]) {
      let executed = 0;
      await assert.rejects(main(["--baseline-only"], { [key]: value }, () => { executed++; }), (error) => {
        assert.match(error.message, /Conflicting database environment/);
        assert.ok(!error.message.includes("do-not-log"));
        return true;
      });
      assert.equal(executed, 0);
    }
  });
}

test("baseline mode has an explicit execution boundary; environment is not a target", async () => {
  let executed = 0;
  await main(["--baseline-only"], { PATH: "/untrusted", LANG: "C" }, () => { executed++; });
  assert.equal(executed, 1); // Fake executor, no processes.
});

test("full verification fails before any executor invocation", async () => {
  let executed = 0;
  await assert.rejects(main(["--full-verification"], {}, () => { executed++; }), { message: BLOCKED });
  assert.equal(executed, 0);
});

test("full-verification CLI actually exits nonzero without PostgreSQL", () => {
  const result = spawnSync(process.execPath, [script, "--full-verification"], {
    env: {}, encoding: "utf8", timeout: 5000, shell: false,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /NOT IMPLEMENTED.*BLOCKED/);
  assert.equal(result.stdout, "");
});

test("default CLI invocation fails, never attaches to an implicit service", () => {
  assert.throws(() => validateRequest([], {}), /required/);
  assert.equal(BIN, "/opt/homebrew/opt/postgresql@17/bin");
});

test("owned target is new, private, short, explicit, and not a URL", () => {
  const run = createOwnedRun();
  try {
    assert.equal(lstatSync(run.root).mode & 0o777, 0o700);
    assert.equal(lstatSync(run.socket).mode & 0o777, 0o700);
    assert.match(run.database, /^p2b1_[0-9a-f]{32}$/);
    assert.ok(!existsSync(run.data), "no PostgreSQL cluster has been initialized");
    const args = psqlArgs(run);
    assert.deepEqual(args, ["-X", "--no-password", "--host", run.socket, "--port", "55432",
      "--username", "p2b1_admin", "--dbname", run.database, "--set", "ON_ERROR_STOP=1", "--no-psqlrc"]);
    assert.throws(() => psqlArgs(run, "foreign"), /Foreign database/);
    assert.throws(() => psqlArgs({ ...run }), /Unowned/);
    assert.throws(() => identitySQL(run, "bad'identity"), /system identifier/);
    const guard = identitySQL(run, "123456789");
    for (const required of ["current_database()", "session_user", "current_user", "server_version_num",
      "data_directory", "unix_socket_directories", "listen_addresses", "p2b1.run_marker",
      "inet_server_addr() is null", "inet_client_addr() is null", "pg_control_system()", "select 1 / 0;"]) {
      assert.ok(guard.includes(required), `identity guard includes ${required}`);
    }
  } finally { removeOwnedRun(run); }
  assert.ok(!existsSync(run.root));
});

test("reject a long macOS socket path before starting a server", () => {
  assert.throws(() => assertSocketPath(`/tmp/${"a".repeat(100)}`), /too long/);
});

test("cleanup rejects a foreign object even with copied marker fields", () => {
  const run = createOwnedRun();
  try {
    assert.throws(() => removeOwnedRun({ ...run }), /Unowned/);
    assert.ok(existsSync(run.root));
    assert.throws(() => removeOwnedRun({ root: "/Users/darshan/chasum" }), /Unowned/);
  } finally { removeOwnedRun(run); }
});

test("cleanup rejects marker tampering and preserves failure artifacts", () => {
  const run = createOwnedRun();
  const marker = join(run.root, "owner.json");
  const original = readFileSync(marker);
  try {
    writeFileSync(marker, "foreign marker");
    assert.throws(() => removeOwnedRun(run), /Unowned/);
    assert.ok(existsSync(run.root));
  } finally { writeFileSync(marker, original); removeOwnedRun(run); }
});

test("cleanup rejects changed directory permissions", () => {
  const run = createOwnedRun();
  try {
    chmodSync(run.root, 0o755);
    assert.throws(() => removeOwnedRun(run), /permissions mismatch/);
    assert.ok(existsSync(run.root));
  } finally { chmodSync(run.root, 0o700); removeOwnedRun(run); }
});

test("cleanup rejects a replaced socket directory", () => {
  const run = createOwnedRun();
  const saved = join(run.root, "saved-socket");
  try {
    renameSync(run.socket, saved);
    mkdirSync(run.socket, { mode: 0o700 });
    assert.throws(() => removeOwnedRun(run), /Socket directory changed/);
  } finally {
    rmSync(run.socket, { recursive: true });
    renameSync(saved, run.socket);
    removeOwnedRun(run);
  }
});

test("cleanup refuses symlink substitution and never traverses another run", () => {
  const run = createOwnedRun();
  const other = createOwnedRun();
  const saved = `${run.root}-saved`;
  try {
    renameSync(run.root, saved);
    symlinkSync(other.root, run.root);
    assert.throws(() => removeOwnedRun(run), /identity\/permissions/);
    assert.ok(existsSync(join(other.root, "owner.json")));
  } finally {
    rmSync(run.root);
    renameSync(saved, run.root);
    removeOwnedRun(run);
    removeOwnedRun(other);
  }
});

test("cleanup removes only its exact registered instance", () => {
  const run = createOwnedRun();
  const other = createOwnedRun();
  try {
    removeOwnedRun(run);
    assert.ok(!existsSync(run.root));
    assertOwnedRun(other);
    assert.throws(() => removeOwnedRun(run), /Unowned/);
  } finally { removeOwnedRun(other); }
});

test("cleanup never removes a directory while its server could be alive", () => {
  const run = createOwnedRun();
  const state = assertOwnedRun(run);
  try {
    state.child = {}; // Simulated lifecycle state only; no child is spawned.
    assert.throws(() => removeOwnedRun(run), /server may be running/);
    assert.ok(existsSync(run.root));
  } finally { state.child = null; removeOwnedRun(run); }
});

test("source hashes and fixed fixture inventory validate without database execution", () => {
  const fixtures = loadFixtures();
  assert.equal(Object.keys(fixtures).length, 5);
  for (const sql of Object.values(fixtures)) {
    assert.doesNotMatch(sql, /^\s*\\(?:connect|c|!|i|ir|include|copy|gexec)\b/im);
  }
  const provenance = JSON.parse(readFileSync(new URL("./provenance.json", import.meta.url), "utf8"));
  const repo = new URL("../../../", import.meta.url);
  for (const entry of provenance.excerpts) {
    const excerpt = readFileSync(new URL(entry.source, repo), "utf8").split("\n")
      .slice(entry.firstLine - 1, entry.lastLine).join("\n") + "\n";
    assert.equal(createHash("sha256").update(excerpt).digest("hex"), entry.sha256);
    const assembled = entry.standaloneTerminator ? `${excerpt.trimEnd()}${entry.standaloneTerminator}\n` : excerpt;
    assert.ok(fixtures["baseline.sql"].includes(assembled), `source excerpt assembly ${entry.source}:${entry.firstLine}`);
  }
  for (const entry of provenance.historicalInputs) {
    const bytes = readFileSync(new URL(entry.fixture, repo));
    const gitBlob = createHash("sha1").update(`blob ${bytes.length}\0`).update(bytes).digest("hex");
    assert.equal(gitBlob, entry.historicalGitBlob, "supplied immutable historical Git identity");
  }
});

test("extracted 033 policy is terminated before the following ALTER TABLE", () => {
  const fixture = loadFixtures()["baseline.sql"];
  const provenance = JSON.parse(readFileSync(new URL("./provenance.json", import.meta.url), "utf8"));
  const entry = provenance.excerpts.find((item) => item.source.endsWith("/033_private_alpha_co_owner_rls.sql"));
  assert.equal(entry.standaloneTerminator, ";");
  const source = readFileSync(new URL(`../../../${entry.source}`, import.meta.url), "utf8");
  const statement = source.split("\n").slice(entry.firstLine - 1, entry.lastLine).join("\n").trimEnd();
  function expectComplete(sql) {
    const start = sql.indexOf(statement);
    assert.notEqual(start, -1, "original policy statement remains present");
    const boundary = sql.slice(start + statement.length);
    assert.match(boundary, /^;\s*(?:--[^\n]*\n\s*)*alter table public\.businesses enable row level security;/,
      "standalone policy must end with a real semicolon before ALTER TABLE");
  }
  expectComplete(fixture);
  const missingTerminator = fixture.replace(`${statement};`, statement);
  assert.notEqual(missingTerminator, fixture);
  assert.throws(() => expectComplete(missingTerminator), { code: "ERR_ASSERTION" });
});
