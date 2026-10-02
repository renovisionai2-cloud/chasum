import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const script = join(process.cwd(), "scripts/verify-release-control-config.mjs");
const dirs: string[] = [];

function fixture(contents: string) {
  const dir = mkdtempSync(join(tmpdir(), "chasum-release-control-"));
  dirs.push(dir);
  const path = join(dir, "vercel.json");
  writeFileSync(path, contents);
  return path;
}

function run(path: string) {
  return spawnSync(process.execPath, [script, path], {
    encoding: "utf8",
  });
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("release-control config guard", () => {
  it("accepts the exact main-only object form", () => {
    const path = fixture(
      JSON.stringify({
        crons: [],
        git: { deploymentEnabled: { main: false } },
      }),
    );

    const result = execFileSync(process.execPath, [script, path], {
      encoding: "utf8",
    });

    expect(result).toBe("release-control config verified\n");
  });

  it("rejects a missing git object", () => {
    const result = run(fixture(JSON.stringify({ crons: [] })));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("must contain a git object");
  });

  it.each([false, true])(
    "rejects boolean deploymentEnabled=%s",
    (deploymentEnabled) => {
      const result = run(
        fixture(JSON.stringify({ git: { deploymentEnabled } })),
      );
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain("must be an object");
    },
  );

  it("rejects main=true", () => {
    const result = run(
      fixture(JSON.stringify({ git: { deploymentEnabled: { main: true } } })),
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("main must be exactly false");
  });

  it("rejects malformed JSON", () => {
    const result = run(fixture("{"));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("must contain valid JSON");
  });
});
