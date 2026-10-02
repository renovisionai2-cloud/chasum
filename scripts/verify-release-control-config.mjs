import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function validateReleaseControlConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("vercel.json root must be a JSON object");
  }

  const git = config.git;
  if (!git || typeof git !== "object" || Array.isArray(git)) {
    throw new Error("vercel.json must contain a git object");
  }

  const deploymentEnabled = git.deploymentEnabled;
  if (
    !deploymentEnabled ||
    typeof deploymentEnabled !== "object" ||
    Array.isArray(deploymentEnabled)
  ) {
    throw new Error(
      "git.deploymentEnabled must be an object; global boolean deployment controls are not allowed",
    );
  }

  if (deploymentEnabled.main !== false) {
    throw new Error("git.deploymentEnabled.main must be exactly false");
  }

  const deploymentKeys = Object.keys(deploymentEnabled);
  if (deploymentKeys.length !== 1 || deploymentKeys[0] !== "main") {
    throw new Error(
      'git.deploymentEnabled must contain exactly the "main" key; additional deployment rules are not allowed',
    );
  }

  return true;
}

export async function validateReleaseControlFile(filePath = "vercel.json") {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error("unable to read " + filePath + ": " + error.message);
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch (error) {
    throw new Error(filePath + " must contain valid JSON: " + error.message);
  }

  return validateReleaseControlConfig(config);
}

const isCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  try {
    await validateReleaseControlFile(process.argv[2] ?? "vercel.json");
    console.log("release-control config verified");
  } catch (error) {
    console.error("Release-control guard: " + error.message);
    process.exitCode = 1;
  }
}
