/**
 * GVM-N01 / Issue #167 — disposable PostgreSQL proof for the nullable
 * customer email migration.
 *
 * Proves, against the effective schema produced by replaying every committed
 * repository migration in filename order:
 *   01  customers.email starts NOT NULL.
 *   02  A NULL email insert is refused before the migration.
 *   03  The committed forward migration applies.
 *   04  customers.email becomes nullable.
 *   05  Two or more customers in one Business can hold a NULL email.
 *   06  Those customers may share one phone number.
 *   07  UNIQUE (business_id, email) still rejects a duplicate genuine email.
 *   08  UNIQUE (id, business_id) is intact and still enforced.
 *   09  No phone uniqueness was added.
 *   10  Pre-existing rows are unchanged and nothing was backfilled.
 *   11  No address was invented ('' or @chasum.local) by the migration.
 *   12  A SET NOT NULL rollback refuses while NULL emails exist.
 *   13  Customer constraints and inbound financial/tenant FKs are unchanged
 *       apart from the email nullability itself.
 *   14  The migration's ACCESS EXCLUSIVE lock claim is accurate.
 *
 * SCHEMA FIDELITY — read this before quoting the result.
 * Every file in supabase/migrations is applied from disk, unmodified, in
 * filename order; a failure to apply fails this script, so nothing is skipped.
 * Supabase *platform* schemas are not in this repository, so `auth`, `storage`
 * and the anon/authenticated/service_role roles are created here as minimal
 * stubs. RLS policy bodies therefore compile but are NOT exercised, and
 * Supabase platform behaviour (PostgREST, GoTrue, Storage) is NOT proven.
 * This is a schema/constraint proof, not an application or platform proof.
 *
 * SAFETY — local, disposable targets only. The script refuses a non-local
 * host, any query string or fragment, a shared-looking database name, and any
 * database that already contains Chasum tables. All PG* variables are stripped
 * from the psql child environment so no ambient setting can redirect the
 * connection. It never contacts Staging or Production.
 *
 * Usage (disposable cluster, destroyed afterwards):
 *   export PGDATA=/tmp/chasum-issue167/data
 *   initdb -D "$PGDATA" -U issue167 --auth=trust -E UTF8
 *   pg_ctl -D "$PGDATA" -o "-p 55433 -h 127.0.0.1" -w start
 *   createdb -h 127.0.0.1 -p 55433 -U issue167 issue167_scratch
 *   ISSUE167_DATABASE_URL=postgresql://issue167@127.0.0.1:55433/issue167_scratch \
 *     node scripts/verify-issue167-disposable-postgres.mjs
 *   pg_ctl -D "$PGDATA" -w stop && rm -rf /tmp/chasum-issue167
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const databaseUrl = process.env.ISSUE167_DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "Missing ISSUE167_DATABASE_URL. Point it at a disposable LOCAL PostgreSQL database.",
  );
  process.exit(1);
}

const N01_MIGRATION = "20261016131500_customers_email_nullable.sql";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function normalizedHostname(url) {
  return url.hostname.replace(/^\[(.*)\]$/, "$1");
}

function isLocalPostgresUrl(value) {
  try {
    const url = new URL(value);
    return (
      new Set(["postgres:", "postgresql:"]).has(url.protocol) &&
      new Set(["localhost", "127.0.0.1", "::1"]).has(normalizedHostname(url)) &&
      url.search === "" &&
      url.hash === "" &&
      !value.includes("?") &&
      !value.includes("#")
    );
  } catch {
    return false;
  }
}

/** A disposable scratch database must not look like a shared environment. */
function isDisposableDatabaseName(value) {
  try {
    const name = new URL(value).pathname.replace(/^\//, "");
    if (!name) return false;
    if (/prod|stag|live|shared|supabase/i.test(name)) return false;
    return !new Set(["postgres", "template0", "template1", "chasum"]).has(name);
  } catch {
    return false;
  }
}

function createPsqlChildEnv(parentEnv = process.env) {
  const childEnv = {};
  for (const [key, value] of Object.entries(parentEnv)) {
    if (/^PG/i.test(key) || value === undefined) continue;
    childEnv[key] = value;
  }
  return childEnv;
}

// ---------------------------------------------------------------------------
// Fail-closed self-tests. A broken guard must not silently allow a real target.
// ---------------------------------------------------------------------------
const sanitizedPoisonedEnv = createPsqlChildEnv({
  ...process.env,
  PGHOSTADDR: "203.0.113.1",
  PGHOST: "evil.example.com",
  PGSERVICE: "evil",
  PGSERVICEFILE: "/tmp/evil",
  PGPORT: "9999",
  PGDATABASE: "evil",
  PGUSER: "evil",
  PGOPTIONS: "-c search_path=evil",
  PGPASSFILE: "/tmp/evil-passfile",
  PGSYSCONFDIR: "/tmp/evil-system-config",
  ISSUE167_ENVIRONMENT_SENTINEL: "preserved",
});
if (
  Object.keys(sanitizedPoisonedEnv).some((key) => /^PG/i.test(key)) ||
  sanitizedPoisonedEnv.ISSUE167_ENVIRONMENT_SENTINEL !== "preserved" ||
  sanitizedPoisonedEnv.PATH !== process.env.PATH
) {
  fail("Issue #167 verifier environment sanitization self-test failed.");
}

for (const allowed of [
  "postgresql://local@localhost/issue167_scratch",
  "postgresql://local@127.0.0.1/issue167_scratch",
  "postgresql://local@[::1]/issue167_scratch",
]) {
  if (!isLocalPostgresUrl(allowed) || !isDisposableDatabaseName(allowed)) {
    fail(`Guard rejected an allowed disposable URL: ${allowed}`);
  }
}
for (const refused of [
  "postgresql://local@example.com/issue167_scratch",
  "postgresql://local@localhost.example.com/issue167_scratch",
  "https://localhost/issue167_scratch",
  "postgresql://local@127.0.0.1/issue167_scratch?host=evil.example.com",
  "postgresql://local@127.0.0.1/issue167_scratch?hostaddr=203.0.113.1",
  "postgresql://local@localhost/issue167_scratch?service=evil",
  "postgresql://local@localhost/issue167_scratch#anything",
]) {
  if (isLocalPostgresUrl(refused)) {
    fail(`Local-host guard accepted a forbidden URL: ${refused}`);
  }
}
for (const refused of [
  "postgresql://local@localhost/postgres",
  "postgresql://local@localhost/chasum",
  "postgresql://local@localhost/chasum_production",
  "postgresql://local@localhost/staging_db",
  "postgresql://local@localhost/shared_scratch",
  "postgresql://local@localhost/",
]) {
  if (isDisposableDatabaseName(refused)) {
    fail(`Disposable-name guard accepted a shared-looking target: ${refused}`);
  }
}

if (!isLocalPostgresUrl(databaseUrl)) {
  let host = "invalid";
  try {
    host = normalizedHostname(new URL(databaseUrl));
  } catch {
    // Keep errors redacted.
  }
  fail(
    `Refusing database URL with authority host "${host}". Issue #167 verification permits PostgreSQL on localhost, 127.0.0.1 or ::1 only, and forbids query strings and fragments.`,
  );
}
if (!isDisposableDatabaseName(databaseUrl)) {
  fail(
    "Refusing this database name. Issue #167 verification requires an explicitly disposable scratch database, never a shared or production-looking name.",
  );
}

const psql = existsSync("/opt/homebrew/bin/psql")
  ? "/opt/homebrew/bin/psql"
  : "psql";
const psqlEnv = createPsqlChildEnv();
const root = process.cwd();

function run(args, { allowFailure = false, print = false } = {}) {
  const result = spawnSync(psql, args, {
    encoding: "utf8",
    stdio: "pipe",
    env: psqlEnv,
  });
  if (print) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
  }
  if (!allowFailure && (result.error || result.status !== 0)) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    if (result.error) console.error(result.error.message);
    process.exit(result.status ?? 1);
  }
  return result;
}

function query(sql, options = {}) {
  const result = run(
    [databaseUrl, "-X", "-At", "-F", "|", "-v", "ON_ERROR_STOP=1", "-c", sql],
    options,
  );
  return {
    status: result.status,
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
  };
}

function exec(sql, options = {}) {
  return run(
    [databaseUrl, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-c", sql],
    options,
  );
}

/** A statement the database itself must refuse. */
function expectRejected(sql, pattern, label) {
  const result = query(sql, { allowFailure: true });
  if (result.status === 0) {
    fail(`${label}: statement unexpectedly succeeded.`);
  }
  if (!pattern.test(result.stderr)) {
    fail(`${label}: unexpected error text:\n${result.stderr}`);
  }
  console.log(`PASS ${label}`);
}

function applyFile(path) {
  return run([databaseUrl, "-X", "-q", "-v", "ON_ERROR_STOP=1", "-f", path], {
    allowFailure: true,
  });
}

const parsed = new URL(databaseUrl);
console.log(
  `Issue #167 disposable target: postgresql://${normalizedHostname(parsed)}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\//, "")} (credentials redacted)`,
);
console.log(
  "PASS local-host, query/fragment, disposable-name and PG* child-environment sanitization self-tests",
);
run([databaseUrl, "--version"], { print: true });

// ---------------------------------------------------------------------------
// Last line of defence: refuse any database that already holds Chasum data.
// ---------------------------------------------------------------------------
const preexisting = query(
  `select coalesce(string_agg(c.relname, ',' order by c.relname), '')
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r'
     and c.relname in ('customers','businesses','appointments','commerce_transactions');`,
).stdout;
if (preexisting !== "") {
  fail(
    `Refusing to run: the target database already contains Chasum tables (${preexisting}). Issue #167 verification requires a freshly created, empty disposable database.`,
  );
}
console.log("PASS target database is empty of Chasum tables");

// ---------------------------------------------------------------------------
// Supabase platform stubs — declared, minimal, and the only substitution.
// ---------------------------------------------------------------------------
exec(`
  create extension if not exists pgcrypto;
  create schema if not exists auth;
  create schema if not exists storage;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text
  );
  create or replace function auth.uid() returns uuid language sql stable as $fn$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $fn$;
  create or replace function auth.role() returns text language sql stable as $fn$
    select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon') $fn$;
  create or replace function auth.jwt() returns jsonb language sql stable as $fn$
    select '{}'::jsonb $fn$;
  create table if not exists storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner uuid,
    created_at timestamptz default now()
  );
  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text,
    owner uuid,
    metadata jsonb,
    created_at timestamptz default now()
  );
  alter table storage.objects enable row level security;
  create or replace function storage.foldername(name text) returns text[]
    language sql immutable as $fn$ select string_to_array(name, '/') $fn$;
  do $role$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon')
      then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated')
      then create role authenticated nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'service_role')
      then create role service_role nologin bypassrls; end if;
    if not exists (select 1 from pg_roles where rolname = 'supabase_admin')
      then create role supabase_admin nologin; end if;
  end $role$;
  grant usage on schema public, storage to anon, authenticated, service_role;
`);
console.log(
  "PASS Supabase platform stubs created (auth, storage, roles) — platform behaviour NOT proven",
);

// ---------------------------------------------------------------------------
// Replay the committed chain up to, but excluding, the N01 migration.
// ---------------------------------------------------------------------------
const migrationDir = resolve(root, "supabase/migrations");
const allMigrations = readdirSync(migrationDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();
if (!allMigrations.includes(N01_MIGRATION)) {
  fail(`Could not find the Issue #167 migration ${N01_MIGRATION}.`);
}
if (allMigrations.at(-1) !== N01_MIGRATION) {
  fail(
    `${N01_MIGRATION} is not last in filename order (last is ${allMigrations.at(-1)}). Resolve the ordering before quoting this proof.`,
  );
}
const priorMigrations = allMigrations.filter((name) => name !== N01_MIGRATION);

for (const name of priorMigrations) {
  const result = applyFile(resolve(migrationDir, name));
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? "");
    fail(
      `Migration ${name} failed to apply. This proof requires the complete committed chain; nothing may be skipped.`,
    );
  }
}
console.log(
  `PASS replayed ${priorMigrations.length} committed migrations in filename order (N01 withheld)`,
);

const NULLABILITY_SQL = `
  select is_nullable from information_schema.columns
  where table_schema = 'public' and table_name = 'customers'
    and column_name = 'email';`;

// --- 01 pre-state -----------------------------------------------------------
const preNullability = query(NULLABILITY_SQL).stdout;
if (preNullability !== "NO") {
  fail(
    `Expected customers.email NOT NULL before the migration, got "${preNullability}".`,
  );
}
console.log("PASS 01 customers.email is NOT NULL before the migration");

// Contract snapshots so any drift is detectable, not assumed.
const CUSTOMER_CONSTRAINTS_SQL = `
  select coalesce(string_agg(format('%s=%s', conname, pg_get_constraintdef(oid)), E'\\n'
           order by conname), '')
  from pg_constraint where conrelid = 'public.customers'::regclass;`;
const INBOUND_FK_SQL = `
  select coalesce(string_agg(format('%s.%s=%s', c.relname, con.conname,
           pg_get_constraintdef(con.oid)), E'\\n' order by c.relname, con.conname), '')
  from pg_constraint con
  join pg_class c on c.oid = con.conrelid
  where con.confrelid = 'public.customers'::regclass and con.contype = 'f';`;
const CUSTOMER_INDEXES_SQL = `
  select coalesce(string_agg(indexdef, E'\\n' order by indexname), '')
  from pg_indexes where schemaname = 'public' and tablename = 'customers';`;

const constraintsBefore = query(CUSTOMER_CONSTRAINTS_SQL).stdout;
const inboundFksBefore = query(INBOUND_FK_SQL).stdout;
const indexesBefore = query(CUSTOMER_INDEXES_SQL).stdout;
if (!/customers_business_id_email_key=UNIQUE \(business_id, email\)/.test(constraintsBefore)) {
  fail(`Expected UNIQUE (business_id, email) before the migration:\n${constraintsBefore}`);
}
if (!/customers_id_business_attempt_key=UNIQUE \(id, business_id\)/.test(constraintsBefore)) {
  fail(`Expected UNIQUE (id, business_id) before the migration:\n${constraintsBefore}`);
}
if (inboundFksBefore === "") {
  fail("Expected inbound tenant/financial foreign keys referencing public.customers.");
}

// Seed rows exactly as older builds wrote them, including one legacy
// placeholder address that Phase 1 must leave untouched.
// The effective schema enforces one business per owner, so each Business in
// this fixture needs its own owner.
const OWNER_A = "16700000-0000-4000-8000-000000000000";
const OWNER_B = "16700000-0000-4000-8000-000000000001";
const BIZ_A = "16700000-0000-4000-8000-00000000000a";
const BIZ_B = "16700000-0000-4000-8000-00000000000b";
const EXISTING_1 = "16700000-0000-4000-8000-000000000101";
const EXISTING_2 = "16700000-0000-4000-8000-000000000102";
const LEGACY_ROW = "16700000-0000-4000-8000-000000000103";
const SHARED_PHONE = "4165550100";

exec(`
  insert into auth.users(id) values ('${OWNER_A}'), ('${OWNER_B}');
  insert into public.businesses(id, owner_id, name, slug)
  values ('${BIZ_A}', '${OWNER_A}', 'Issue167 A', 'issue167-a'),
         ('${BIZ_B}', '${OWNER_B}', 'Issue167 B', 'issue167-b');
  insert into public.customers(id, business_id, name, email, phone)
  values ('${EXISTING_1}', '${BIZ_A}', 'Existing One', 'one@example.invalid', '${SHARED_PHONE}'),
         ('${EXISTING_2}', '${BIZ_A}', 'Existing Two', 'two@example.invalid', '${SHARED_PHONE}'),
         ('${LEGACY_ROW}', '${BIZ_A}', 'Legacy Placeholder',
          'phone.${SHARED_PHONE}@chasum.local', '${SHARED_PHONE}');
`);

/** md5 over the complete JSON of the named rows, including updated_at. */
function rowFingerprint(ids) {
  const list = ids.map((id) => `'${id}'`).join(",");
  return query(`
    select md5(coalesce(string_agg(t.row_json, E'\\n' order by t.id), ''))
    from (
      select c.id::text as id, to_jsonb(c)::text as row_json
      from public.customers c
      where c.id in (${list})
    ) t;`).stdout;
}

const PRESEEDED_IDS = [EXISTING_1, EXISTING_2, LEGACY_ROW];
const fingerprintBefore = rowFingerprint(PRESEEDED_IDS);
const countsBefore = query(
  `select count(*), count(email), count(*) filter (where email is null)
   from public.customers;`,
).stdout;
if (countsBefore !== "3|3|0") {
  fail(`Unexpected seeded row counts: ${countsBefore}`);
}

// --- 02 NULL refused before the migration -----------------------------------
expectRejected(
  `insert into public.customers(business_id, name, email, phone)
   values ('${BIZ_A}', 'Pre Migration Null', null, '4165550900');`,
  /null value in column "email"|violates not-null constraint/i,
  "02 a NULL email insert is refused before the migration",
);

// --- 03 forward migration ---------------------------------------------------
const forward = applyFile(resolve(migrationDir, N01_MIGRATION));
if (forward.status !== 0) {
  process.stderr.write(forward.stderr ?? "");
  fail("The Issue #167 forward migration failed to apply.");
}
console.log(`PASS 03 forward migration applied from ${N01_MIGRATION}`);

// --- 04 nullable ------------------------------------------------------------
const postNullability = query(NULLABILITY_SQL).stdout;
if (postNullability !== "YES") {
  fail(
    `Expected customers.email to be nullable after the migration, got "${postNullability}".`,
  );
}
console.log("PASS 04 customers.email is nullable after the migration");

// --- 05/06 multiple NULL-email customers sharing one phone ------------------
const PHONE_ONLY_1 = "16700000-0000-4000-8000-000000000201";
const PHONE_ONLY_2 = "16700000-0000-4000-8000-000000000202";
exec(`
  insert into public.customers(id, business_id, name, email, phone)
  values ('${PHONE_ONLY_1}', '${BIZ_A}', 'Phone Only One', null, '${SHARED_PHONE}'),
         ('${PHONE_ONLY_2}', '${BIZ_A}', 'Phone Only Two', null, '${SHARED_PHONE}');
`);
const phoneOnly = query(
  `select count(*), count(distinct id), count(distinct phone)
   from public.customers
   where business_id = '${BIZ_A}' and email is null;`,
).stdout;
if (phoneOnly !== "2|2|1") {
  fail(`Expected two distinct NULL-email customers on one shared phone, got ${phoneOnly}`);
}
console.log(
  "PASS 05 two distinct NULL-email customers coexist in one Business under UNIQUE (business_id, email)",
);
console.log(`PASS 06 both NULL-email customers share phone ${SHARED_PHONE}`);

// --- 07 duplicate genuine email still rejected ------------------------------
expectRejected(
  `insert into public.customers(business_id, name, email, phone)
   values ('${BIZ_A}', 'Duplicate Email', 'one@example.invalid', '4165550901');`,
  /duplicate key value violates unique constraint "customers_business_id_email_key"/i,
  "07 a duplicate genuine email is still rejected in the same Business",
);
exec(`
  insert into public.customers(business_id, name, email, phone)
  values ('${BIZ_B}', 'Other Business Same Email', 'one@example.invalid', '4165550902');
`);
console.log(
  "PASS 07b the same genuine email remains allowed in a different Business (tenant scoping preserved)",
);

// --- 08 composite tenant identity key --------------------------------------
expectRejected(
  `insert into public.customers(id, business_id, name, email, phone)
   values ('${PHONE_ONLY_1}', '${BIZ_B}', 'Id Reuse', null, '4165550903');`,
  /duplicate key value violates unique constraint/i,
  "08 UNIQUE (id, business_id) and the primary key still reject a reused customer id",
);

// --- 09 no phone uniqueness -------------------------------------------------
const phoneUniqueness = query(
  `select coalesce(string_agg(conname, ','), '')
   from pg_constraint
   where conrelid = 'public.customers'::regclass
     and contype in ('u','p')
     and pg_get_constraintdef(oid) ilike '%phone%';`,
).stdout;
const phoneUniqueIndexes = query(
  `select coalesce(string_agg(indexname, ','), '')
   from pg_indexes
   where schemaname = 'public' and tablename = 'customers'
     and indexdef ilike '%unique%' and indexdef ilike '%phone%';`,
).stdout;
if (phoneUniqueness !== "" || phoneUniqueIndexes !== "") {
  fail(
    `Unexpected phone uniqueness: constraints=[${phoneUniqueness}] indexes=[${phoneUniqueIndexes}]`,
  );
}
console.log("PASS 09 no phone unique constraint and no unique phone index exist");

// --- 10 existing rows unchanged, no backfill --------------------------------
const fingerprintAfter = rowFingerprint(PRESEEDED_IDS);
if (fingerprintAfter !== fingerprintBefore) {
  fail(
    "Pre-existing customer rows changed across the migration. Expected byte-identical rows and no backfill.",
  );
}
console.log(
  "PASS 10 the three pre-existing rows are byte-identical after the migration (no backfill, no rewrite)",
);

// --- 11 no invented addresses ----------------------------------------------
const invented = query(
  `select count(*) filter (where email = ''),
          count(*) filter (where email like '%@chasum.local')
   from public.customers;`,
).stdout;
if (invented !== "0|1") {
  fail(
    `Expected zero empty-string emails and exactly the one pre-seeded legacy placeholder, got ${invented}`,
  );
}
console.log(
  "PASS 11 the migration invented no address: no '' emails, and only the pre-seeded legacy placeholder remains",
);

// --- 12 rollback refuses while NULL emails exist ---------------------------
expectRejected(
  `alter table public.customers alter column email set not null;`,
  /column "email" of relation "customers" contains null values/i,
  "12 SET NOT NULL rollback is refused while NULL emails exist",
);
const stillNullable = query(NULLABILITY_SQL).stdout;
if (stillNullable !== "YES") {
  fail("A refused rollback must leave customers.email nullable.");
}
const nullCount = query(
  `select count(*) from public.customers where email is null;`,
).stdout;
if (nullCount !== "2") {
  fail(`A refused rollback must not alter rows; expected 2 NULL emails, got ${nullCount}`);
}
console.log(
  "PASS 12b the refused rollback left the column nullable and both NULL-email rows intact (one-way door, no invented address)",
);

// --- 13 constraint and inbound FK contracts unchanged ----------------------
const constraintsAfter = query(CUSTOMER_CONSTRAINTS_SQL).stdout;
const inboundFksAfter = query(INBOUND_FK_SQL).stdout;
const indexesAfter = query(CUSTOMER_INDEXES_SQL).stdout;
if (constraintsAfter !== constraintsBefore) {
  fail(
    `Customer constraints changed across the migration.\nBEFORE:\n${constraintsBefore}\nAFTER:\n${constraintsAfter}`,
  );
}
if (inboundFksAfter !== inboundFksBefore) {
  fail(
    `Inbound financial/tenant foreign keys changed across the migration.\nBEFORE:\n${inboundFksBefore}\nAFTER:\n${inboundFksAfter}`,
  );
}
if (indexesAfter !== indexesBefore) {
  fail(
    `Customer indexes changed across the migration.\nBEFORE:\n${indexesBefore}\nAFTER:\n${indexesAfter}`,
  );
}
console.log(
  `PASS 13 customer constraints, indexes and all ${inboundFksAfter.split("\n").length} inbound financial/tenant foreign keys are unchanged; only the email nullability moved`,
);

// --- 14 lock claim ---------------------------------------------------------
const lockProbe = query(
  `begin;
   alter table public.customers alter column email drop not null;
   select mode from pg_locks
   where relation = 'public.customers'::regclass and locktype = 'relation'
     and pid = pg_backend_pid()
   order by mode;
   rollback;`,
).stdout;
if (!lockProbe.split("\n").includes("AccessExclusiveLock")) {
  fail(
    `Expected the migration's DDL to take AccessExclusiveLock on public.customers, observed: ${lockProbe.replace(/\n/g, ",")}`,
  );
}
console.log(
  "PASS 14 the DDL takes AccessExclusiveLock on public.customers — the migration's documented lock claim is accurate, and it is not lock-free",
);

console.log("");
console.log("Issue #167 disposable PostgreSQL contract passed.");
console.log(
  `Fidelity: complete committed migration chain replayed (${allMigrations.length} files, none skipped); Supabase auth/storage/roles substituted by local stubs; RLS policy behaviour and Supabase platform services NOT proven.`,
);
