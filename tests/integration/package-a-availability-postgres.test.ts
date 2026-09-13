// @vitest-environment node
// Opt-in, synthetic local PostgreSQL only. No URLs or hosted credentials accepted.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";

const enabled = process.env.CHASUM_RUN_PACKAGE_A_PG === "1";
const b = "10000000-0000-4000-8000-000000000001";
const l = "10000000-0000-4000-8000-000000000002";
const s = "10000000-0000-4000-8000-000000000003";
const st = "10000000-0000-4000-8000-000000000004";
const ap = "10000000-0000-4000-8000-000000000005";
const day = "((now() at time zone 'America/Toronto')::date + 7)";
const at = (time: string) => `((${day} + time '${time}') at time zone 'America/Toronto')`;
const slots = (exclude = "NULL") => `get_available_slots('${b}','${s}','${st}',${day},${exclude},'${l}')`;
const offered = (time: string, exclude = "NULL") => `EXISTS(SELECT 1 FROM ${slots(exclude)} t WHERE t=${at(time)})`;
function sql(statement: string) {
  return execFileSync("/opt/homebrew/opt/postgresql@17/bin/psql", [
    "-X", "-w", "-Atq", "-v", "ON_ERROR_STOP=1", "-h", "/private/tmp/chasum-package-a-pg/socket",
    "-p", "55483", "-U", "postgres", "-d", "package_a", "-c", statement,
  ], { encoding: "utf8", timeout: 15000, env: { PATH: "/usr/bin:/bin", PGPASSFILE: "/dev/null", PGSERVICEFILE: "/dev/null" }, stdio: ["ignore", "pipe", "pipe"] }).trim();
}
const seed = `
INSERT INTO businesses(id,timezone,min_notice_minutes,allow_double_booking,booking_limit_days,appointment_interval_minutes) VALUES('${b}','America/Toronto',0,false,365,5);
INSERT INTO locations(id,business_id,timezone,is_default) VALUES('${l}','${b}','America/Toronto',true);
INSERT INTO location_settings(location_id,appointment_interval_minutes,booking_limit_days,min_booking_notice_minutes) VALUES('${l}',5,365,0);
INSERT INTO services(id,business_id,location_id,is_active,duration_minutes,cleanup_minutes) VALUES('${s}','${b}','${l}',true,30,5);
INSERT INTO staff(id,business_id,location_id,is_active) VALUES('${st}','${b}','${l}',true);
INSERT INTO staff_services(staff_id,service_id) VALUES('${st}','${s}');
INSERT INTO location_hours(location_id,day_of_week,is_open,open_time,close_time) SELECT '${l}',d,true,'09:00','17:00' FROM generate_series(0,6)d;
INSERT INTO staff_working_hours(staff_id,day_of_week,is_working,start_time,end_time) SELECT '${st}',d,true,'09:00','17:00' FROM generate_series(0,6)d;
INSERT INTO appointments(id,business_id,location_id,service_id,staff_id,status,start_time,end_time) VALUES('${ap}','${b}','${l}','${s}','${st}','confirmed',${at('10:00')},${at('10:30')});`;
function probe(changes: string, query: string) { return sql(`BEGIN; ${seed} ${changes} SELECT ${query}; ROLLBACK;`); }

describe.skipIf(!enabled)("Package A actual PostgreSQL availability", () => {
  beforeAll(() => {
    expect(sql("SELECT current_database() || '|' || (inet_server_addr() IS NULL)::text || '|' || current_setting('data_directory');"))
      .toBe("package_a|true|/private/tmp/chasum-package-a-pg/data");
    expect(sql("SELECT count(*) FROM pg_proc WHERE proname='availability_block_reason';")).toBe("1");
  });
  it("rehearses exact 008 → target → rollback, metadata and injected transaction failure", () => {
    const forward = readFileSync("sql/recovery/A_production_availability_engine_realign.sql", "utf8");
    const rollback = readFileSync("sql/recovery/A_production_availability_engine_rollback.sql", "utf8");
    const captured = JSON.parse(readFileSync("tests/fixtures/package-a/production-functions.json", "utf8"));
    const snapshot = () => JSON.parse(sql("SELECT json_agg(t ORDER BY proname) FROM (SELECT proname,pg_get_functiondef(p.oid) definition,prosrc,proacl::text acl,pg_get_userbyid(proowner) owner,obj_description(p.oid,'pg_proc') comment FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND proname IN ('slot_is_blocked','get_available_slots','validate_appointment_slot','availability_block_reason'))t"));
    const normalized = (rows: { proname: string; definition: string; prosrc: string; acl: string; owner: string; comment: string | null }[]) => rows.map(r => ({ proname: r.proname, definition: r.definition, prosrc: r.prosrc, acl: r.acl.slice(1, -1).split(",").sort(), owner: r.owner, comment: r.comment })).sort((a, b) => a.proname.localeCompare(b.proname));
    const target = normalized(snapshot());
    sql(rollback);
    expect(normalized(snapshot())).toEqual(normalized(captured));
    expect(() => sql(forward.replace("COMMIT;", "DO $$ BEGIN RAISE EXCEPTION 'injected Package A failure'; END $$; COMMIT;"))).toThrow(/injected Package A failure/);
    expect(normalized(snapshot())).toEqual(normalized(captured));
    sql(forward);
    expect(normalized(snapshot())).toEqual(target);
    sql(rollback);
    expect(normalized(snapshot())).toEqual(normalized(captured));
    sql(forward);
  });
  it("five-minute cleanup rejects the immediately-following 10:30 slot", () => {
    expect(probe("", offered("10:30"))).toBe("f");
  });
  it("validator rejects that immediately-following cleanup slot", () => {
    expect(() => sql(`BEGIN; ${seed} SELECT validate_appointment_slot('${b}','${s}','${st}',${at('10:30')},${at('11:00')},NULL,'${l}'); ROLLBACK;`)).toThrow();
  });
  it("zero cleanup permits an adjacent slot", () => {
    expect(probe("UPDATE services SET cleanup_minutes=0;", offered("10:30"))).toBe("t");
  });
  it("known-good 10:35 remains offered", () => { expect(probe("", offered("10:35"))).toBe("t"); });
  it("candidate cleanup blocks a slot immediately before an existing booking", () => { expect(probe("", offered("09:30"))).toBe("f"); });
  it("staff lunch blocks noon", () => { expect(probe("UPDATE staff_working_hours SET lunch_start_time='12:00',lunch_end_time='13:00';", offered("12:00"))).toBe("f"); });
  it("split location hours exclude the gap", () => {
    expect(probe(`INSERT INTO location_hour_segments(location_id,day_of_week,open_time,close_time,sort_order) VALUES('${l}',extract(dow from ${day}), '09:00','11:00',0),('${l}',extract(dow from ${day}),'14:00','17:00',1);`, offered("12:00"))).toBe("f");
  });
  it("business closure excludes the date", () => { expect(probe(`INSERT INTO business_closures(business_id,location_id,closure_type,starts_at,ends_at) VALUES('${b}','${l}','temporary',${at('09:00')},${at('17:00')});`, offered("12:00"))).toBe("f"); });
  it("staff closure blocks its interval", () => { expect(probe(`INSERT INTO staff_closures(business_id,location_id,staff_id,starts_at,ends_at) VALUES('${b}','${l}','${st}',${at('12:00')},${at('13:00')});`, offered("12:00"))).toBe("f"); });
  it("service blackout blocks its interval", () => { expect(probe(`INSERT INTO service_blackouts(business_id,location_id,service_id,starts_at,ends_at) VALUES('${b}','${l}','${s}',${at('12:00')},${at('13:00')});`, offered("12:00"))).toBe("f"); });
  it.each(["staff", "services"])("%s daily cap is enforced", table => { expect(probe(`UPDATE ${table} SET max_appointments_per_day=1;`, offered("12:00"))).toBe("f"); });
  it("service minimum notice is enforced", () => { expect(probe("UPDATE services SET min_booking_notice_minutes=20000;", offered("12:00"))).toBe("f"); });
  it("service booking horizon is enforced", () => { expect(probe("UPDATE services SET max_booking_days_ahead=1;", offered("12:00"))).toBe("f"); });
  it("duration override prevents extending past closing", () => { expect(probe("UPDATE staff_services SET duration_override_minutes=60;", offered("16:30"))).toBe("f"); });
  it("service_locations permits a secondary location", () => { expect(probe(`UPDATE services SET location_id='10000000-0000-4000-8000-000000000099'; INSERT INTO service_locations(service_id,location_id) VALUES('${s}','${l}');`, offered("12:00"))).toBe("t"); });
  it("exclude appointment permits rescheduling the same appointment", () => { expect(probe("", offered("10:00", `'${ap}'`))).toBe("t"); });
  it("GiST still rejects raw overlap", () => {
    expect(() => sql(`BEGIN; ${seed} INSERT INTO appointments(staff_id,status,start_time,end_time) VALUES('${st}','confirmed',${at('10:15')},${at('10:45')}); ROLLBACK;`)).toThrow(/appointments_staff_no_overlap/);
  });
  it("Toronto slots retain instants under Auckland session timezone", () => {
    expect(probe("SET LOCAL timezone='Pacific/Auckland';", offered("12:00"))).toBe("t");
  });
  it("Toronto opening after the next autumn DST boundary uses winter UTC offset", () => {
    const dst = "make_date(extract(year from now())::int + 1,11,8)";
    expect(probe("UPDATE location_settings SET booking_limit_days=730; UPDATE businesses SET booking_limit_days=730;", `EXISTS(SELECT 1 FROM get_available_slots('${b}','${s}','${st}',${dst},NULL,'${l}') t WHERE t=(${dst}+time '14:00') AT TIME ZONE 'UTC')`)).toBe("t");
  });
});
