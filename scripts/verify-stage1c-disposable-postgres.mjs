import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const databaseUrl = process.env.STAGE1C_DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing STAGE1C_DATABASE_URL.");
  process.exit(1);
}

let parsed;
try {
  parsed = new URL(databaseUrl);
} catch {
  console.error("STAGE1C_DATABASE_URL must be a valid PostgreSQL URL.");
  process.exit(1);
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
if (!localHosts.has(parsed.hostname)) {
  console.error(
    `Refusing non-local database host "${parsed.hostname}". Stage 1C verification must run against disposable local PostgreSQL only.`,
  );
  process.exit(1);
}

const migration = resolve(
  process.cwd(),
  "supabase/migrations/20260922210000_issue_81_stage_1c_location_template.sql",
);
const contract = resolve(
  process.cwd(),
  "tests/postgres/issue-81-stage1c-contract.sql",
);

function run(args, options = {}) {
  const result = spawnSync("psql", args, {
    stdio: options.capture ? "pipe" : "inherit",
    encoding: "utf8",
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stderr ?? "");
      process.stdout.write(result.stdout ?? "");
    }
    process.exit(result.status ?? 1);
  }
  return result;
}

function runAsync(sql) {
  return new Promise((resolvePromise) => {
    const child = spawn(
      "psql",
      [databaseUrl, "-v", "ON_ERROR_STOP=1", "-c", sql],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (status) => {
      resolvePromise({ status, stdout, stderr });
    });
  });
}

run(["--version"]);
run([databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", migration]);
run([databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", contract]);

const ownerId = "30000000-0000-0000-0000-000000000101";
const businessId = "30000000-0000-0000-0000-000000000201";

const setupSql = `
set session_replication_role = replica;
insert into public.businesses(
  id, owner_id, name, slug, timezone, appointment_interval_minutes,
  booking_limit_days, subscription_plan_key, private_alpha_enabled
) values (
  '${businessId}','${ownerId}','Stage1C Concurrency','stage1c-concurrency',
  'UTC',30,60,'professional',false
);
set session_replication_role = origin;
insert into public.locations(business_id,name,slug,timezone,is_active,is_default)
values
  ('${businessId}','Existing One','concurrency-one','UTC',true,true),
  ('${businessId}','Existing Two','concurrency-two','UTC',true,false);
`;
run([databaseUrl, "-v", "ON_ERROR_STOP=1", "-c", setupSql]);

const call = (suffix) => `
begin;
set local role authenticated;
select set_config('request.jwt.claim.sub','${ownerId}',true);
select public.create_location_from_template(
  '${businessId}',
  'Concurrent ${suffix}',
  'concurrent-${suffix}',
  'UTC',
  null,null,null,null,null,null,
  'blank',
  null
);
commit;
`;

const results = await Promise.all([runAsync(call("a")), runAsync(call("b"))]);
const successes = results.filter((result) => result.status === 0);
const failures = results.filter((result) => result.status !== 0);

if (successes.length !== 1 || failures.length !== 1) {
  console.error("Expected exactly one concurrent location create to succeed.");
  console.error(JSON.stringify(results, null, 2));
  process.exit(1);
}

if (!failures[0].stderr.includes("LOCATION_LIMIT_REACHED")) {
  console.error("Concurrent loser did not fail on the governed location limit.");
  console.error(failures[0].stderr);
  process.exit(1);
}

const verify = run(
  [
    databaseUrl,
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `select count(*) from public.locations where business_id='${businessId}' and is_active=true;`,
  ],
  { capture: true },
);
if (verify.stdout.trim() !== "3") {
  console.error(
    `Expected exactly 3 active locations after concurrency test, got ${verify.stdout.trim()}.`,
  );
  process.exit(1);
}

run([
  databaseUrl,
  "-v",
  "ON_ERROR_STOP=1",
  "-c",
  `delete from public.businesses where id='${businessId}';`,
]);

console.log("Stage 1C disposable PostgreSQL contract + concurrency race passed.");
