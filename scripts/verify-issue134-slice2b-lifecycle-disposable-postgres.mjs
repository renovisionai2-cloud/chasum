import {sessionFactory} from './proofs/issue-134-slice2b-lifecycle/sessions.mjs';
import {runConcurrency} from './proofs/issue-134-slice2b-lifecycle/concurrency.mjs';
import {runExtended} from './proofs/issue-134-slice2b-lifecycle/extended-cases.mjs';
import {runGuards} from './proofs/issue-134-slice2b-lifecycle/guard-cases.mjs';
import {runFinal} from './proofs/issue-134-slice2b-lifecycle/final-cases.mjs';
import {runDomain} from './proofs/issue-134-slice2b-lifecycle/domain-cases.mjs';
import {runCases} from './proofs/issue-134-slice2b-lifecycle/cases.mjs';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync, readdirSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { userInfo } from 'node:os';

const args=process.argv.slice(2);
if(args.length!==1 || args[0]!=='--confirm-disposable-local') {
  console.error('Usage: node scripts/verify-issue134-slice2b-lifecycle-disposable-postgres.mjs --confirm-disposable-local');
  process.exit(2);
}
const root=process.cwd();
const bin='/opt/homebrew/opt/postgresql@17/bin';
const user=userInfo().username;
const id=randomUUID();
const work=mkdtempSync('/private/tmp/chasum-d1-pg17-');
const data=join(work,'pgdata'), socket=join(work,'socket'), home=join(work,'home');
for(const p of [socket,home])mkdirSync(p,{mode:0o700});
const evidence=join(root,'docs/validation/issue-134-slice2b-local-delta',id);
mkdirSync(evidence,{recursive:true});
const env={PATH:`${bin}:/usr/bin:/bin`,HOME:home,USER:user,LOGNAME:user,LANG:'C',LC_ALL:'C',TZ:'UTC',PGPASSFILE:join(home,'pgpass'),PGSERVICEFILE:join(home,'pg_service.conf'),PGSYSCONFDIR:home};
writeFileSync(env.PGPASSFILE,'',{mode:0o600});writeFileSync(env.PGSERVICEFILE,'',{mode:0o600});
const summary={run_id:id,start:new Date().toISOString(),status:'STARTED',work,data,socket,port:55473,database:'d1_lifecycle',external_connections:false,source_hashes:{},cases:{},failures:[]};
for(let i=1;i<=15;i++)summary.cases[`D${String(i).padStart(2,'0')}`]='NOT_RUN';
for(let i=1;i<=11;i++)summary.cases[`C${String(i).padStart(2,'0')}`]='NOT_RUN';
for(const c of ['D12-E','D12-F','D14-E','D14-F','D14-G'])summary.cases[c]='NOT_RUN';
function run(exe,argv,phase,input){
 const r=spawnSync(exe,argv,{cwd:root,env,encoding:'utf8',input,timeout:120000,maxBuffer:8*1024*1024});
 writeFileSync(join(evidence,phase+'.log'),(r.stdout??'')+(r.stderr??''));
 appendFileSync(join(evidence,'timeline.jsonl'),JSON.stringify({at:new Date().toISOString(),phase,status:r.status,error:r.error?.message})+'\n');
 if(r.error||r.status!==0)throw new Error(`${phase}: ${r.error?.message??`exit ${r.status}`}`);
 return r.stdout.trim();
}
const conn=['-X','--no-password','-h',socket,'-p','55473','-U',user,'-d','d1_lifecycle','-v','ON_ERROR_STOP=1','-v','VERBOSITY=verbose'];
function sql(s,phase){return run(join(bin,'psql'),[...conn,'-At'],phase,s);}
function file(p,phase){const bytes=readFileSync(resolve(root,p));summary.source_hashes[p]=createHash('sha256').update(bytes).digest('hex');return run(join(bin,'psql'),[...conn,'-f',resolve(root,p)],phase);}
for(const p of ['scripts/verify-issue134-slice2b-lifecycle-disposable-postgres.mjs','scripts/proofs/issue-134-slice2b-lifecycle/cases.mjs','scripts/proofs/issue-134-slice2b-lifecycle/generate-migration.py']) summary.source_hashes[p]=createHash('sha256').update(readFileSync(join(root,p))).digest('hex');
function catalog(phase){
 const value=JSON.parse(sql(`select jsonb_build_object('functions',(select jsonb_agg(jsonb_build_object('oid',p.oid,'schema',n.nspname,'name',p.proname,'identity',p.oid::regprocedure::text,'owner',pg_get_userbyid(p.proowner),'acl',p.proacl,'security_definer',p.prosecdef,'volatility',p.provolatile,'config',p.proconfig,'language',(select lanname from pg_language where oid=p.prolang),'body_md5',md5(p.prosrc),'arguments',pg_get_function_arguments(p.oid),'result',pg_get_function_result(p.oid)) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','booking_lifecycle_private')), 'triggers',(select jsonb_agg(jsonb_build_object('table',tgrelid::regclass::text,'name',tgname,'enabled',tgenabled,'internal',tgisinternal,'definition',pg_get_triggerdef(oid)) order by tgrelid,tgname) from pg_trigger where tgrelid in ('public.appointments'::regclass,'public.appointment_resources'::regclass)), 'constraints',(select jsonb_agg(jsonb_build_object('table',conrelid::regclass::text,'name',conname,'validated',convalidated,'definition',pg_get_constraintdef(oid)) order by conrelid,conname) from pg_constraint where conrelid in ('public.appointments'::regclass,'public.appointment_resources'::regclass)),'policies',(select jsonb_agg(jsonb_build_object('table',polrelid::regclass::text,'name',polname,'command',polcmd,'roles',polroles,'using',pg_get_expr(polqual,polrelid),'check',pg_get_expr(polwithcheck,polrelid)) order by polrelid,polname) from pg_policy),'lifecycle_relations',(select jsonb_agg(jsonb_build_object('table',c.oid::regclass::text,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force',c.relforcerowsecurity,'acl',c.relacl,'columns',(select jsonb_agg(jsonb_build_object('name',attname,'type',format_type(atttypid,atttypmod),'not_null',attnotnull,'default',pg_get_expr(d.adbin,d.adrelid)) order by attnum) from pg_attribute a left join pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum where a.attrelid=c.oid and a.attnum>0 and not a.attisdropped),'constraints',(select jsonb_agg(jsonb_build_object('name',conname,'definition',pg_get_constraintdef(oid),'validated',convalidated) order by conname) from pg_constraint where conrelid=c.oid),'indexes',(select jsonb_agg(pg_get_indexdef(indexrelid) order by indexrelid) from pg_index where indrelid=c.oid)) order by c.oid) from pg_class c where c.oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass,to_regclass('booking_lifecycle_private.appointment_mutations'))),'roles',(select jsonb_agg(jsonb_build_object('role',rolname,'super',rolsuper,'bypass',rolbypassrls,'inherit',rolinherit) order by rolname) from pg_roles where rolname in ('anon','authenticated','authenticator','service_role',current_user)));`,phase));
 writeFileSync(join(evidence,phase+'.json'),JSON.stringify(value,null,2)+'\n');return value;
}
for(const name of readdirSync(join(root,'scripts/proofs/issue-134-slice2b-lifecycle'))){const p='scripts/proofs/issue-134-slice2b-lifecycle/'+name;summary.source_hashes[p]=createHash('sha256').update(readFileSync(join(root,p))).digest('hex');}
let started=false;
try{
 const d1Path='docs/reviews/issue-134-slice2b-d1-lifecycle-sql-contract-freeze.md';
 const d1Bytes=readFileSync(join(root,d1Path));
 if(createHash('sha256').update(d1Bytes).digest('hex')!=='0caf4f79ce43088520313728b4d3cd77758b0aa066f8f2f776f4714f9ebff6ed')throw new Error('Accepted D1 identity mismatch before SQL');
 const expected=[...d1Bytes.toString().matchAll(/\| `([^`]+\.(?:sql|md))` \| `([a-f0-9]{64})` \|/g)];
 if(expected.length!==8)throw new Error('Protected source manifest changed');
 summary.protected_sources={};
 for(const [,name,digest] of expected){const p=(name.endsWith('.sql')?'supabase/migrations/':'docs/reviews/')+name;const actual=createHash('sha256').update(readFileSync(join(root,p))).digest('hex');if(actual!==digest)throw new Error('Protected source changed: '+p);summary.protected_sources[p]=actual;}
 summary.accepted_d1_sha256=createHash('sha256').update(d1Bytes).digest('hex');
 // Separate provenance pins: do not alter the accepted eight-entry D1 manifest.
 // Check bytes before initdb, cluster startup, or any local SQL.
 summary.availability_sources={};
 for(const [p,digest] of [
  ['supabase/migrations/026_availability_engine.sql','37b19fb00c95994b5c8c05d143b7fc668b1d032c665ed3ce43aba8a33caea0a8'],
  ['sql/recovery/A_production_availability_engine_realign.sql','84863ad305bd98b01e817a43153f3344e816c5994c32f7b8452e2c09aac94fdf'],
 ]){
  const actual=createHash('sha256').update(readFileSync(join(root,p))).digest('hex');
  if(actual!==digest)throw new Error('Availability prerequisite source changed before SQL: '+p);
  summary.availability_sources[p]=actual;
 }
 const version=run(join(bin,'postgres'),['--version'],'00-version');
 if(!/^postgres \(PostgreSQL\) 17\./.test(version))throw new Error('PostgreSQL 17 required');
 summary.version=version;
 run(join(bin,'initdb'),['-D',data,'--no-locale','--encoding=UTF8','--auth-local=trust','--auth-host=reject'],'01-initdb');
 const config=`\nlisten_addresses = ''\nunix_socket_directories = '${socket}'\nport = 55473\nmax_connections = 20\nlock_timeout = '5s'\nstatement_timeout = '30s'\n`;
 appendFileSync(join(data,'postgresql.conf'),config);
 run(join(bin,'pg_ctl'),['-D',data,'-l',join(work,'server.log'),'-w','start'],'02-start');started=true;
 // No SQL has executed: fresh initdb path + postmaster identity/config precede the first connection.
 const pid=readFileSync(join(data,'postmaster.pid'),'utf8').trim().split('\n');
 if(realpathSync(pid[1])!==realpathSync(data)||pid[3]!=='55473'||pid[4]!==socket||pid[5]!=='')throw new Error('Local postmaster identity mismatch');
 summary.postmaster={pid:Number(pid[0]),data:pid[1],port:pid[3],socket:pid[4],listen:pid[5]};
 run('/bin/ps',['-p',pid[0],'-o','pid=,command='],'03-process');
 run(join(bin,'createdb'),['--no-password','-h',socket,'-p','55473','-U',user,'d1_lifecycle'],'04-createdb');
 const identity=JSON.parse(sql(`select json_build_object('database',current_database(),'user',current_user,'version_num',current_setting('server_version_num'),'data',current_setting('data_directory'),'port',current_setting('port'),'listen',current_setting('listen_addresses'),'server_addr',inet_server_addr(),'public_tables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')));`,'05-identity'));
 if(identity.database!=='d1_lifecycle'||identity.user!==user||!identity.version_num.startsWith('17')||realpathSync(identity.data)!==realpathSync(data)||identity.listen!==''||identity.server_addr!==null||identity.public_tables!==0)throw new Error('Fresh database isolation assertion failed');
 summary.identity=identity;
 file('scripts/proofs/issue-134-slice2b-lifecycle/local-platform.sql','06-local-platform');
 const migrations=readdirSync(join(root,'supabase/migrations')).filter(n=>/^0\d\d_.*\.sql$/.test(n)&&Number(n.slice(0,3))<=33).sort();
 for(const n of migrations)file('supabase/migrations/'+n,'baseline-'+n.replace('.sql',''));
 // Historical 026 -> accepted Package A -> later Issue 81 -> financial dependencies.
 file('sql/recovery/A_production_availability_engine_realign.sql','baseline-package-a-availability');
 for(const n of [
 '039_business_slug_aliases.sql',
 '20260920230358_tenant_identity_gate.sql',
 '20260922050000_issue_81_stage_1b_relationship_booking_convergence.sql',
 '20261004190341_issue_134_payment_attempt_foundation.sql',
 '20261005154345_issue_134_r1a_manual_payment_kernel.sql',
 '20261007012529_issue_134_appointment_financial_attribution.sql',
 '20261007203352_issue_134_durable_booking_operation.sql',
 '20261008210359_issue_133_payment_projection_observability.sql',
 ])file('supabase/migrations/'+n,'dependency-'+n.replace('.sql',''));
 run(join(bin,'createdb'),['--no-password','-h',socket,'-p','55473','-U',user,'--template=d1_lifecycle','d1_assertion_rollback'],'rollback-clone-createdb');
 const failureScript=readFileSync(join(root,'supabase/migrations/20261013201608_issue_134_slice2b_lifecycle_amendment.sql'),'utf8').replace(/commit;\s*$/,"do $fail$ begin raise exception 'EXPECTED_FINAL_ASSERTION_FAILURE';end $fail$;\ncommit;");
 const failConn=conn.map(x=>x==='d1_lifecycle'?'d1_assertion_rollback':x);
 try{run(join(bin,'psql'),[...failConn,'-At'],'expected-migration-final-assertion',failureScript);throw new Error('MIGRATION_FAILURE_NOT_OBSERVED');}
 catch(e){if(!readFileSync(join(evidence,'expected-migration-final-assertion.log'),'utf8').includes('EXPECTED_FINAL_ASSERTION_FAILURE'))throw e;}
 const rolled=run(join(bin,'psql'),[...failConn,'-At'],'migration-rollback-catalog',"select json_build_object('db',current_database(),'journal_schema',to_regnamespace('booking_lifecycle_private'),'revision_columns',(select count(*) from pg_attribute where attrelid='public.appointments'::regclass and attname='operational_revision' and not attisdropped),'v2_count',(select count(*) from pg_proc where proname='revise_booking_notes_v2'));");
 const rollbackState=JSON.parse(rolled);if(rollbackState.db!=='d1_assertion_rollback'||rollbackState.journal_schema!==null||rollbackState.revision_columns!==0||rollbackState.v2_count!==0)throw new Error('Migration rollback incomplete');
 summary.migration_assertion_rollback=rollbackState;
 const capabilityNegatives=[];
 for(const role of ['anon','authenticated','authenticator','service_role']){
  for(const table of ['appointments','appointment_resources']){
   for(const privilege of ['TRUNCATE','TRIGGER']){
    capabilityNegatives.push([`unsafe-${role}-${table}-${privilege.toLowerCase()}`,
     `grant ${privilege} on public.${table} to ${role};`,
     role==='service_role'?'LIFECYCLE_UNSAFE_OPERATIONAL_CAPABILITY':
      privilege==='TRIGGER'?'LIFECYCLE_OPERATIONAL_TRIGGER_CAPABILITY':'LIFECYCLE_OPERATIONAL_DDL_CAPABILITY']);
   }
  }
 }
 for(const table of ['appointments','appointment_resources']){
  for(const privilege of ['TRUNCATE','TRIGGER']){
   capabilityNegatives.push([`unsafe-public-${table}-${privilege.toLowerCase()}`,
    `grant ${privilege} on public.${table} to public;`,'LIFECYCLE_UNSAFE_OPERATIONAL_CAPABILITY']);
  }
 }
 // Isolated, transaction-local role chains; no real guard is replaced or disabled.
 for(const role of ['anon','authenticator']){
  for(const mode of ['inherited','set-role']){
   for(const privilege of ['TRUNCATE','TRIGGER']){
    capabilityNegatives.push([`unsafe-${role}-${mode}-${privilege.toLowerCase()}`,
     `create role d1_capability_leaf nologin nosuperuser nobypassrls;
      create role d1_capability_bridge nologin nosuperuser nobypassrls;
      grant ${privilege} on public.appointment_resources to d1_capability_leaf;
      grant d1_capability_leaf to d1_capability_bridge with inherit ${mode==='inherited'};
      grant d1_capability_leaf to d1_capability_bridge with set ${mode==='set-role'};
      grant d1_capability_bridge to ${role} with inherit ${mode==='inherited'};
      grant d1_capability_bridge to ${role} with set ${mode==='set-role'};`,
     privilege==='TRIGGER'?'LIFECYCLE_OPERATIONAL_TRIGGER_CAPABILITY':'LIFECYCLE_OPERATIONAL_DDL_CAPABILITY']);
   }
  }
 }
 const negativeBaselineSql=`select jsonb_build_object(
  'roles',(select jsonb_agg(to_jsonb(r) order by oid) from pg_roles r),
  'memberships',(select jsonb_agg(to_jsonb(m) order by roleid,member,grantor) from pg_auth_members m),
  'table_acls',(select jsonb_agg(jsonb_build_object('oid',oid,'acl',relacl) order by oid) from pg_class where oid in ('public.appointments'::regclass,'public.appointment_resources'::regclass))
 );`;
 const negativeBaseline=run(join(bin,'psql'),[...failConn,'-At'],'gate-capability-baseline',negativeBaselineSql);
 for(const [name,setup,expected] of [
  ['disabled-parent-guard','alter table public.appointments disable trigger appointments_booking_operation_guard;','LIFECYCLE_DISABLED_INTEGRITY_TRIGGER'],
  ['unsafe-parameter-grant',"grant set on parameter session_replication_role to service_role;",'LIFECYCLE_UNSAFE_OPERATIONAL_CAPABILITY'],
  ...capabilityNegatives,
 ]){
  const script='begin;\n'+setup+'\n'+readFileSync(join(root,'supabase/migrations/20261013201608_issue_134_slice2b_lifecycle_amendment.sql'),'utf8');
  try{run(join(bin,'psql'),[...failConn,'-At'],'gate-'+name,script);throw new Error('CATALOG_GATE_DID_NOT_REFUSE');}catch(e){if(!readFileSync(join(evidence,'gate-'+name+'.log'),'utf8').includes(expected))throw e;}
  const restored=JSON.parse(run(join(bin,'psql'),[...failConn,'-At'],'gate-'+name+'-rollback',"select json_build_object('journal_schema',to_regnamespace('booking_lifecycle_private'),'guard_enabled',(select tgenabled from pg_trigger where tgrelid='public.appointments'::regclass and tgname='appointments_booking_operation_guard'),'parameter_set',has_parameter_privilege('service_role','session_replication_role','SET'));") );
  if(restored.journal_schema!==null||restored.guard_enabled!=='O'||restored.parameter_set)throw new Error('Catalog failure rollback did not restore fixture');
  if(run(join(bin,'psql'),[...failConn,'-At'],'gate-'+name+'-capability-rollback',negativeBaselineSql)!==negativeBaseline)throw new Error('Catalog failure rollback did not restore roles/memberships/table ACLs');
  summary['catalog_negative_'+name]=restored;
 }
 const beforeCatalog=catalog('before-lifecycle-catalog');
 file('supabase/migrations/20261013201608_issue_134_slice2b_lifecycle_amendment.sql','07-lifecycle-migration');
 const afterCatalog=catalog('after-lifecycle-catalog');
 for(const original of beforeCatalog.functions){if(['close_booking_operation_v1','guard_appointment_booking_operation_link_v1'].includes(original.name))continue;const after=afterCatalog.functions.find(x=>x.oid===original.oid);if(JSON.stringify(after)!==JSON.stringify(original))throw new Error('Protected function catalog changed: '+original.identity);}
 summary.protected_function_catalog='PASS';
 const log=r=>appendFileSync(join(evidence,'observations.jsonl'),JSON.stringify(r)+'\n');
 const ctx=await runCases({sql,summary,log});
 await runExtended({ctx,summary,log});
 await runGuards({ctx,summary,log});
 await runDomain({ctx,summary,log});
 await runFinal({ctx,summary,log});
 const sessions=sessionFactory({bin,conn,env,log});
 try{await runConcurrency({ctx,sessions,summary,log});}finally{await sessions.close();}
 const apiConn=conn.map(x=>x===user?'authenticator':x);
 const apiIdentity=run(join(bin,'psql'),[...apiConn,'-At'],'non-super-session-capability',`begin;set local role service_role;select json_build_object('session_user',session_user,'current_user',current_user,'database',current_database(),'super',(select rolsuper from pg_roles where rolname=current_user));do $cap$ begin begin set role ${user};exception when insufficient_privilege then raise notice 'OWNER_ESCALATION_DENIED';return;end;raise exception 'UNEXPECTED_OWNER_ESCALATION';end $cap$;rollback;`);
 summary.non_super_session_probe=apiIdentity;
 const finalCatalog=catalog('final-local-catalog');
 if(JSON.stringify(finalCatalog)!==JSON.stringify(afterCatalog))throw new Error('Proof instrumentation or function drift remains');
 summary.final_catalog_preserved='PASS';
 const effectTables=JSON.parse(sql("select coalesce(json_agg(tablename order by tablename),'[]') from pg_tables where schemaname='public' and (tablename~'(notification|send_intent|calendar|waitlist|webhook)' or tablename='background_jobs');",'side-effect-tables'));
 const effectCounts={};for(const table of effectTables){if(!/^[a-z0-9_]+$/.test(table))throw new Error('Unsafe local catalog identifier');effectCounts[table]=Number(sql('select count(*) from public."'+table+'";','side-effects-'+table));}
 if(Object.values(effectCounts).some(x=>x!==0))throw new Error('Unintended SQL side effect');
 summary.side_effect_counts=effectCounts;summary.cases.D15='PASS';
 summary.cases.D11='PASS';
 summary.additional_proof_required=true;
 summary.remaining_required_subcases={D09:summary.D09_limitation,C09:summary.C09_limitation,application:'A1/A2 normalization and actual application orchestration NOT_RUN; outside SQL authorization',hosted:'Hosted role/default-privilege/schema equivalence NOT_RUN'};
 summary.status='LOCAL_PROOF_INCOMPLETE';
}catch(e){summary.status='LOCAL_PROOF_INCOMPLETE';summary.failures.push(e.message);console.error(e.message);process.exitCode=1;}
finally{
 if(started){try{run(join(bin,'pg_ctl'),['-D',data,'-m','fast','-w','stop'],'99-stop');summary.stopped=true;}catch(e){summary.stopped=false;summary.failures.push(e.message);process.exitCode=1;}}
 summary.end=new Date().toISOString();
 writeFileSync(join(evidence,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 console.log(JSON.stringify({status:summary.status,evidence,stopped:summary.stopped,failures:summary.failures}));
}
