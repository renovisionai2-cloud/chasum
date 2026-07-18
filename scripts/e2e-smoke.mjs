#!/usr/bin/env node
/**
 * E2E entrypoint used by `npm run test:e2e`.
 * Prefer Playwright when Chromium is available; otherwise run API smoke
 * against a local `next start` (useful when browser CDN is blocked).
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

function hasPlaywrightBrowser() {
  const roots = [
    path.join(homedir(), "Library/Caches/ms-playwright"),
    path.join(homedir(), ".cache/ms-playwright"),
    path.join(process.cwd(), "node_modules/.cache/ms-playwright"),
  ];
  return roots.some((root) => {
    if (!existsSync(root)) return false;
    try {
      return readdirSync(root).some((name) => name.startsWith("chromium"));
    } catch {
      return false;
    }
  });
}

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
      shell: process.platform === "win32",
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function apiSmoke() {
  const health = await fetch(`${baseURL}/api/health`);
  const body = await health.json();
  if (![200, 503].includes(health.status)) {
    throw new Error(`health unexpected status ${health.status}`);
  }
  if (typeof body.ok !== "boolean" || !body.checks) {
    throw new Error("health payload missing ok/checks");
  }
  if (!("softSchemaFallbacks" in body.checks)) {
    throw new Error("health missing softSchemaFallbacks check");
  }

  const home = await fetch(`${baseURL}/`);
  if (!home.ok) throw new Error(`home status ${home.status}`);

  const login = await fetch(`${baseURL}/login`);
  if (!login.ok) throw new Error(`login status ${login.status}`);

  console.log("API e2e smoke passed (Playwright browser unavailable).");
}

async function withServer(fn) {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    await fn();
    return;
  }

  const server = spawn("npm", ["run", "start"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    shell: process.platform === "win32",
  });

  let ready = false;
  const onData = (buf) => {
    const text = buf.toString();
    if (text.includes("Ready") || text.includes("started") || text.includes("Local:")) {
      ready = true;
    }
  };
  server.stdout?.on("data", onData);
  server.stderr?.on("data", onData);

  const started = Date.now();
  while (!ready && Date.now() - started < 90_000) {
    try {
      const res = await fetch(baseURL);
      if (res.status > 0) {
        ready = true;
        break;
      }
    } catch {
      // wait
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  if (!ready) {
    server.kill("SIGTERM");
    throw new Error("next start did not become ready in time");
  }

  try {
    await fn();
  } finally {
    server.kill("SIGTERM");
  }
}

async function main() {
  if (hasPlaywrightBrowser() || process.env.CI) {
    await run("npx", ["playwright", "test"]);
    return;
  }

  console.warn(
    "[e2e] Playwright Chromium not installed; running API smoke fallback. Run `npm run test:e2e:install` when network allows.",
  );
  await withServer(apiSmoke);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
