import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { verifyProductionBuildInfo } from "../../scripts/verify-production-build-info.mjs";

const sha = "abcdef01".repeat(5);
const valid = {
  commit: sha,
  commitShort: sha.slice(0, 7),
  env: "production",
  ref: "main",
  production: true,
};

test("accepts exact canonical Production identity", () => {
  assert.equal(verifyProductionBuildInfo(valid, sha.toUpperCase()), valid);
});

test("rejects wrong SHA env ref production flag short SHA and unexpected fields", () => {
  assert.throws(
    () => verifyProductionBuildInfo({ ...valid, commit: "1".repeat(40) }, sha),
    /commit does not match/,
  );
  assert.throws(
    () => verifyProductionBuildInfo({ ...valid, commitShort: "bad" }, sha),
    /commitShort/,
  );
  assert.throws(
    () => verifyProductionBuildInfo({ ...valid, env: "preview" }, sha),
    /env is not production/,
  );
  assert.throws(
    () => verifyProductionBuildInfo({ ...valid, ref: "release" }, sha),
    /ref is not main/,
  );
  assert.throws(
    () => verifyProductionBuildInfo({ ...valid, production: false }, sha),
    /production flag/,
  );
  assert.throws(() => verifyProductionBuildInfo(valid, "main"), /40 hexadecimal/);
  assert.throws(
    () => verifyProductionBuildInfo({ ...valid, secret: "no" }, sha),
    /shape is unexpected/,
  );
});

test("CLI reads supplied JSON only and fails closed on malformed input", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "chasum-build-info-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const path = join(dir, "build-info.json");
  const script = fileURLToPath(
    new URL("../../scripts/verify-production-build-info.mjs", import.meta.url),
  );

  writeFileSync(path, JSON.stringify(valid));
  const ok = spawnSync(process.execPath, [script, path, "--sha", sha], {
    encoding: "utf8",
  });
  assert.equal(ok.status, 0, ok.stderr);

  writeFileSync(path, "{");
  const bad = spawnSync(process.execPath, [script, path, "--sha", sha], {
    encoding: "utf8",
  });
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /not valid JSON/);
});
