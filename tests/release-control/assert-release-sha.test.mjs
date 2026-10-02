import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, test } from "node:test";
import { assertReleaseSha, validateCandidatePolicy } from "../../scripts/assert-release-sha.mjs";

const directories = [];
const guardPath = fileURLToPath(
  new URL("../../scripts/assert-release-sha.mjs", import.meta.url),
);
const now = Date.parse("2026-10-01T12:00:00Z");
const approved = (sha, expiresAt = "2026-10-02T12:00:00Z") => ({
  sha,
  status: "approved",
  expiresAt,
});
const policy = (...candidates) => ({ version: 1, candidates });

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_AUTHOR_NAME: "Release Control Test",
      GIT_AUTHOR_EMAIL: "release-control@example.invalid",
      GIT_COMMITTER_NAME: "Release Control Test",
      GIT_COMMITTER_EMAIL: "release-control@example.invalid",
    },
  }).trim();
}

function commit(cwd, message) {
  git(cwd, "add", ".");
  git(cwd, "-c", "commit.gpgsign=false", "commit", "--allow-empty", "-m", message);
  return git(cwd, "rev-parse", "HEAD");
}

function setPolicy(cwd, value) {
  writeFileSync(join(cwd, "release", "candidates.json"), JSON.stringify(value));
  const main = commit(cwd, "set candidate policy");
  git(cwd, "update-ref", "refs/remotes/origin/main", main);
  return main;
}

function repository() {
  const cwd = mkdtempSync(join(tmpdir(), "chasum-release-sha-"));
  directories.push(cwd);
  git(cwd, "init", "--initial-branch=main");
  mkdirSync(join(cwd, "release"));
  writeFileSync(join(cwd, "release", "candidates.json"), JSON.stringify(policy()));
  const sha = commit(cwd, "candidate");
  git(cwd, "remote", "add", "origin", join(cwd, "inert-origin-not-contacted"));
  git(cwd, "update-ref", "refs/remotes/origin/main", sha);
  return { cwd, sha };
}

afterEach(() => {
  for (const cwd of directories.splice(0)) {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("accepts approved main ancestor using fetched-main policy", () => {
  const { cwd, sha } = repository();
  setPolicy(cwd, policy(approved(sha.toUpperCase())));
  assert.equal(assertReleaseSha(sha.toUpperCase(), { cwd, now }), sha);
});

test("rejects unapproved revoked expired and exactly-expiring candidates", () => {
  const { cwd, sha } = repository();
  assert.throws(() => assertReleaseSha(sha, { cwd, now }), /unapproved/);

  setPolicy(cwd, policy({ ...approved(sha), status: "revoked" }));
  assert.throws(() => assertReleaseSha(sha, { cwd, now }), /revoked/);

  for (const expiresAt of [
    "2026-09-30T12:00:00Z",
    "2026-10-01T12:00:00.000Z",
  ]) {
    setPolicy(cwd, policy(approved(sha, expiresAt)));
    assert.throws(() => assertReleaseSha(sha, { cwd, now }), /stale.*expired/);
  }
});

test("latest fetched policy overrides candidate-local approval", () => {
  const { cwd, sha } = repository();
  const approvedMain = setPolicy(cwd, policy(approved(sha)));
  assert.equal(assertReleaseSha(sha, { cwd, now }), sha);

  setPolicy(cwd, policy({ ...approved(sha), status: "revoked" }));
  git(cwd, "checkout", "--detach", approvedMain);
  assert.throws(() => assertReleaseSha(sha, { cwd, now }), /revoked/);
});

test("requires main ancestry existing commit complete history and origin", () => {
  const { cwd, sha } = repository();
  setPolicy(cwd, policy(approved(sha)));
  git(cwd, "checkout", "-b", "side", sha);
  const side = commit(cwd, "side commit");
  git(cwd, "checkout", "main");
  setPolicy(cwd, policy(approved(sha), approved(side), approved("0".repeat(40))));

  assert.throws(() => assertReleaseSha(side, { cwd, now }), /not an ancestor/);
  assert.throws(
    () => assertReleaseSha("0".repeat(40), { cwd, now }),
    /existing local Git object/,
  );

  git(cwd, "config", "remote.origin.promisor", "true");
  assert.throws(() => assertReleaseSha(sha, { cwd, now }), /Partial clone/);
  git(cwd, "config", "--unset", "remote.origin.promisor");

  const main = git(cwd, "rev-parse", "refs/remotes/origin/main");
  writeFileSync(join(cwd, ".git", "shallow"), main + "\n");
  assert.throws(() => assertReleaseSha(sha, { cwd, now }), /history is shallow/);
  rmSync(join(cwd, ".git", "shallow"));

  git(cwd, "remote", "remove", "origin");
  assert.throws(() => assertReleaseSha(sha, { cwd, now }), /origin remote is required/);
});

test("rejects missing malformed and invalid policy schemas", () => {
  const { cwd, sha } = repository();
  for (const raw of ["{", "null", "[]", '{"version":2,"candidates":[]}']) {
    writeFileSync(join(cwd, "release", "candidates.json"), raw);
    const main = commit(cwd, "invalid policy");
    git(cwd, "update-ref", "refs/remotes/origin/main", main);
    assert.throws(() => assertReleaseSha(sha, { cwd, now }), /valid JSON|Candidate policy/);
  }

  rmSync(join(cwd, "release", "candidates.json"));
  const main = commit(cwd, "missing policy");
  git(cwd, "update-ref", "refs/remotes/origin/main", main);
  assert.throws(
    () => assertReleaseSha(sha, { cwd, now }),
    /must contain release\/candidates.json/,
  );
});

test("policy rejects duplicate SHAs unknown fields wrong types statuses and times", () => {
  const sha = "a".repeat(40);
  for (const value of [
    {},
    null,
    [],
    { version: 1, candidates: [], extra: true },
    { version: 1, candidates: {} },
    { version: "1", candidates: [] },
    policy(null),
    policy({ ...approved(sha), extra: true }),
    policy({ sha, status: "approved" }),
    policy(approved("main")),
    policy({ ...approved(sha), status: "pending" }),
    policy(approved(sha), approved(sha.toUpperCase())),
  ]) {
    assert.throws(() => validateCandidatePolicy(value), /Candidate policy|entry|duplicate/);
  }

  for (const expiresAt of [
    "forever",
    "2026-10-02",
    "2026-02-30T12:00:00Z",
    "2026-10-02T12:00:00+00:00",
  ]) {
    assert.throws(
      () => validateCandidatePolicy(policy(approved(sha, expiresAt))),
      /expiresAt/,
    );
  }
});

test("CLI rejects floating short malformed and extra arguments", () => {
  const { cwd, sha } = repository();
  setPolicy(cwd, policy(approved(sha, "9999-12-31T23:59:59Z")));

  const success = spawnSync(process.execPath, [guardPath, sha.toUpperCase()], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(success.status, 0, success.stderr);
  assert.equal(success.stdout, sha + "\n");

  for (const args of [
    [],
    ["main"],
    ["origin/main"],
    [sha.slice(0, 12)],
    [sha + "\n"],
    [sha, "extra"],
  ]) {
    const failure = spawnSync(process.execPath, [guardPath, ...args], {
      cwd,
      encoding: "utf8",
    });
    assert.equal(failure.status, 1);
    assert.match(failure.stderr, /Release guard:/);
  }
});
