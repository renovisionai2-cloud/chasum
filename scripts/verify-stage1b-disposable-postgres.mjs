import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const databaseUrl = process.env.STAGE1B_DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing STAGE1B_DATABASE_URL.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("STAGE1B_DATABASE_URL must be a valid PostgreSQL URL.");
  process.exit(1);
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
if (!localHosts.has(parsed.hostname)) {
  console.error(
    `Refusing non-local database host "${parsed.hostname}". Stage 1B verification must run against disposable local PostgreSQL only.`,
  );
  process.exit(1);
}

const migration = resolve(
  process.cwd(),
  "supabase/migrations/20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql",
);
const contract = resolve(
  process.cwd(),
  "tests/postgres/issue-81-stage1b-contract.sql",
);

function run(args) {
  const result = spawnSync("psql", args, { stdio: "inherit" });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(["--version"]);
run([databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", migration]);
run([databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", contract]);

console.log("Stage 1B disposable PostgreSQL contract passed.");
