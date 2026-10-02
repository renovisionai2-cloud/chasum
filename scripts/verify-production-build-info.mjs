import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const allowed = ["commit", "commitShort", "env", "ref", "production"];

export function verifyProductionBuildInfo(value, expectedSha) {
  if (typeof expectedSha !== "string" ||
      expectedSha.length !== 40 ||
      !/^[0-9a-fA-F]{40}$/.test(expectedSha)) {
    throw new Error("Expected SHA must be exactly 40 hexadecimal characters.");
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Build info must be a JSON object.");
  }

  const keys = Object.keys(value);
  if (keys.length !== allowed.length ||
      keys.some((key) => !allowed.includes(key)) ||
      allowed.some((key) => !Object.hasOwn(value, key))) {
    throw new Error("Build info shape is unexpected; refusing ambiguous identity data.");
  }

  const sha = expectedSha.toLowerCase();
  if (value.commit !== sha) throw new Error("Build info commit does not match expected SHA.");
  if (value.commitShort !== sha.slice(0, 7)) {
    throw new Error("Build info commitShort does not match expected SHA.");
  }
  if (value.env !== "production") throw new Error("Build info env is not production.");
  if (value.ref !== "main") throw new Error("Build info ref is not main.");
  if (value.production !== true) throw new Error("Build info production flag is not true.");

  return value;
}

function main() {
  try {
    const [path, flag, sha, ...rest] = process.argv.slice(2);
    if (!path || flag !== "--sha" || !sha || rest.length !== 0) {
      throw new Error(
        "Usage: node scripts/verify-production-build-info.mjs <json-file> --sha <40-character-sha>",
      );
    }

    let value;
    try {
      value = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error("Build info file is not valid JSON.");
      throw error;
    }

    verifyProductionBuildInfo(value, sha);
    process.stdout.write("Production build identity verified.\n");
  } catch (error) {
    process.stderr.write("Production identity verification failed: " + error.message + "\n");
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
