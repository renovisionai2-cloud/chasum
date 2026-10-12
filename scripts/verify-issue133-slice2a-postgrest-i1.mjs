// Opt-in local query proof only; no application imports, hosted credentials or downloads.
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, rmSync, realpathSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

if (process.env.CHASUM_SLICE2A_I1_LOCAL_PROOF !== '1') {
  console.error('Refusing execution: set CHASUM_SLICE2A_I1_LOCAL_PROOF=1. Disposable LOCAL proof only.');
  process.exit(2);
}
const root = realpathSync(process.cwd());
const pgBin = realpathSync(process.env.I1_PG_BIN ?? '/opt/homebrew/opt/postgresql@17/bin');
assert(process.env.I1_POSTGREST_BIN, 'I1_POSTGREST_BIN must identify a local executable');
const pgrstBin = realpathSync(process.env.I1_POSTGREST_BIN);
const libDir = process.env.I1_LIBPQ_DIR ? realpathSync(process.env.I1_LIBPQ_DIR) : undefined;
for (const n of ['initdb', 'pg_ctl', 'postgres', 'psql']) assert(existsSync(join(pgBin, n)), n);
const designPath = 'docs/reviews/issue-133-slice2-canonical-financial-wiring-design.md';
const sha = b => createHash('sha256').update(b).digest('hex');
assert.equal(sha(readFileSync(join(root, designPath))), '1f1a966c8466d6f124adab76a2bb188497c363a30d1f104df42c663d7eba029a');
const out = mkdtempSync('/private/tmp/chasum-i1-run-');
const data = join(out, 'pgdata'), socket = join(out, 'socket'), marker = randomUUID();
mkdirSync(socket, { mode: 0o700 });
writeFileSync(join(out, 'empty'), '', { mode: 0o600 });
// Explicit allowlist: no inherited PG*, PGRST*, credentials, proxy or injection variables.
const env = { PATH: `${pgBin}:/usr/bin:/bin`, HOME: out, LC_ALL: 'C', TZ: 'UTC', PGPASSFILE: join(out, 'empty'), PGSERVICEFILE: join(out, 'empty'), PGSYSCONFDIR: out };
if (libDir) env.DYLD_LIBRARY_PATH = libDir;
const evidence = { proofVersion: 1, timestamp: new Date().toISOString(), designSha256: sha(readFileSync(join(root, designPath))), harnessSha256: sha(readFileSync(new URL(import.meta.url))), localOnly: true, migrations: [], P: {}, N: {}, cleanup: {} };
let started = false, child, childDone;
let interrupted = false;
const interrupt = () => { interrupted = true; };
process.on('SIGINT', interrupt);
process.on('SIGTERM', interrupt);
function command(bin, args, input) {
  if (interrupted && !args.includes('stop') && !args.includes('status')) throw new Error('Local proof interrupted; cleanup required');
  const r = spawnSync(bin, args, { env, input, encoding: 'utf8', timeout: 120000, maxBuffer: 16e6 });
  if (r.error || r.status !== 0) throw new Error(`${bin}: ${r.error ?? r.stderr ?? r.status}`);
  return r.stdout;
}
const psqlArgs = ['-X', '-h', socket, '-p', '55439', '-U', 'i1_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1'];
function sql(text) { return command(join(pgBin, 'psql'), [...psqlArgs, '-Atq'], text).trim(); }
function jsonSql(text) { return JSON.parse(sql(text)); }
async function port() {
  const s = createServer(); await new Promise((res, rej) => { s.once('error', rej); s.listen(0, '127.0.0.1', res); });
  const p = s.address().port; await new Promise(res => s.close(res)); return p;
}
const id = n => `a1332000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const A=id(1), B=id(2), customerA=id(21), customerB=id(22), loc=id(31);
const cases=['CLEAN','SAME_BUSINESS_TRANSACTION_REFUND','CROSS_BUSINESS_TRANSACTION_REFUND','APPOINTMENT_ONLY_REFUND'];
const roots=cases.map((name,i)=>({name,transaction:id(101+i),appointment:id(201+i),attempt:id(301+i)}));
const foreignTx=id(109);
const bootstrap = `create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create table auth.users(id uuid primary key,email text);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create function auth.role() returns text language sql stable as $$select nullif(current_setting('request.jwt.claim.role',true),'')$$;
create schema storage; create table storage.buckets(id text primary key,name text,public boolean);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text);
create function storage.foldername(text) returns text[] language sql immutable as $$select (string_to_array($1,'/'))[1:array_length(string_to_array($1,'/'),1)-1]$$;`;
try {
  evidence.postgresVersion=command(join(pgBin,'postgres'),['--version']).trim();
  evidence.postgrestVersion=command(pgrstBin,['--version']).trim();
  evidence.binary={path:pgrstBin,sha256:sha(readFileSync(pgrstBin)),libpqDirectory:libDir??null};
  evidence.referenceRelease={version:'16.4',platform:'macOS ARM64',url:'https://github.com/PostgREST/postgrest/releases/tag/v16.4',archiveUrl:'https://github.com/PostgREST/postgrest/releases/download/v16.4/postgrest-v16.4-macos-aarch64.tar.xz',archiveSha256:'5720fbde4a19ade9fb189791615c84beb9f0e58201b1b6d17fe3b698faf60776',binarySha256:'325628d6bc975251c2952c1275e969b8dc57f88db32dfb82c4c6597cebcd260b'};
  assert.equal(evidence.postgrestVersion,'PostgREST 16.4','Different version requires separate proof reconciliation');
  assert.equal(evidence.binary.sha256,evidence.referenceRelease.binarySha256,'Use the exact reviewed official binary');
  command(join(pgBin,'initdb'),['-D',data,'-U','i1_admin','--auth=trust','--encoding=UTF8','--locale=C']);
  writeFileSync(join(data,'.i1-owned'),marker,{flag:'wx',mode:0o600});
  started=true;
  command(join(pgBin,'pg_ctl'),['-D',data,'-l',join(out,'postgres.log'),'-o',`-c listen_addresses='' -c unix_socket_directories='${socket}' -c port=55439 -c logging_collector=off -c log_statement=all`,'-w','start']);
  assert.equal(sql("select current_setting('listen_addresses')='' and current_setting('data_directory')='"+data+"'"),'t');
  sql(bootstrap);
  evidence.bootstrap={scope:'Supabase auth/storage external platform prerequisites only; every application relation comes from unchanged repository migrations',sha256:sha(bootstrap)};
  const names=readdirSync(join(root,'supabase/migrations')).filter(n=>/^0\d\d_/.test(n)).sort();
  names.push('20261004190341_issue_134_payment_attempt_foundation.sql','20261005154345_issue_134_r1a_manual_payment_kernel.sql','20261007012529_issue_134_appointment_financial_attribution.sql','20261007203352_issue_134_durable_booking_operation.sql','20261008210359_issue_133_payment_projection_observability.sql');
  for (const name of names) {
    const path=join(root,'supabase/migrations',name);
    command(join(pgBin,'psql'),[...psqlArgs,'-f',path]);
    evidence.migrations.push({name,sha256:sha(readFileSync(path))});
  }
  console.log('Real migration schema ready.');
  // Fictional local fixtures only; do not disable constraints or triggers.
  sql(`insert into auth.users(id,email) values ('${id(11)}','owner-a@example.invalid'),('${id(12)}','owner-b@example.invalid');
    insert into businesses(id,owner_id,name,slug,currency) values ('${A}','${id(11)}','I1 Local A','i1-local-a','cad'),('${B}','${id(12)}','I1 Local B','i1-local-b','cad');
    insert into customers(id,business_id,name,email) values ('${customerA}','${A}','I1 Fictional A','a@example.invalid'),('${customerB}','${B}','I1 Fictional B','b@example.invalid');
    insert into locations(id,business_id,name,slug,timezone) values ('${loc}','${A}','I1 Local Location','i1-local-location','UTC');
    insert into services(id,business_id,location_id,name,duration_minutes,price) values ('${id(41)}','${A}','${loc}','I1 Local Service',30,25);
    insert into staff(id,business_id,location_id,name) values ('${id(51)}','${A}','${loc}','I1 Local Staff');
    grant select,insert on public.commerce_transactions to service_role;
    grant select on public.businesses,public.customers,public.appointments to service_role;`);
  for (const [i,r] of roots.entries()) {
    sql(`insert into appointments(id,business_id,customer_id,location_id,service_id,staff_id,start_time,end_time,status,price_cents,tax_cents,deposit_cents)
      values ('${r.appointment}','${A}','${customerA}','${loc}','${id(41)}','${id(51)}','2032-01-${String(10+i).padStart(2,'0')} 12:00+00','2032-01-${String(10+i).padStart(2,'0')} 12:30+00','confirmed',2500,0,0);
      set role service_role;
      insert into commerce_payment_attempts(id,business_id,attempt_key,request_fingerprint,source,customer_id,appointment_id,payment_kind,amount_cents,currency,method,provider_route,execution_state,recovery_disposition,resolved_at)
      values ('${r.attempt}','${A}','${id(401+i)}','v1:'||repeat('${i+1}',64),'collect_payment','${customerA}','${r.appointment}','payment',2500,'cad','cash','manual','ACCEPTED','DO_NOT_RETRY','2032-01-01 12:00+00');
      insert into commerce_transactions(id,business_id,customer_id,appointment_id,payment_attempt_id,kind,status,method,amount_cents,currency,provider,occurred_at)
      values ('${r.transaction}','${A}','${customerA}','${r.appointment}','${r.attempt}','payment','succeeded','cash',2500,'cad','manual','2032-01-01 12:00+00');
      reset role;`);
  }
  sql(`insert into commerce_transactions(id,business_id,customer_id,kind,status,method,amount_cents,currency,provider,occurred_at)
    values ('${foreignTx}','${B}','${customerB}','payment','succeeded','cash',2500,'cad','manual','2032-01-01 12:00+00');`);
  const refunds=[
    {id:id(501),business:A,customer:customerA,tx:roots[1].transaction,appt:null},
    {id:id(502),business:B,customer:customerB,tx:roots[2].transaction,appt:null},
    {id:id(503),business:B,customer:customerB,tx:roots[2].transaction,appt:null},
    {id:id(504),business:B,customer:customerB,tx:foreignTx,appt:roots[3].appointment},
    {id:id(505),business:B,customer:customerB,tx:foreignTx,appt:roots[3].appointment}
  ];
  const forbidden=[B,customerB,id(12),foreignTx,'987654321','zzq','I1_REFUND_REASON_CANARY','I1_REFUND_PROVIDER_CANARY','I1_REFUND_REFERENCE_CANARY','I1_REFUND_METADATA_CANARY','rejected','failed','2047-06-17'];
  for(const r of refunds) {
    forbidden.push(r.id);
    sql(`insert into commerce_refunds(id,business_id,customer_id,transaction_id,appointment_id,amount_cents,currency,reason,provider,provider_reference,metadata,approval_status,approved_by,approved_at,created_by,created_at,updated_at,status)
      values ('${r.id}','${r.business}','${r.customer}','${r.tx}',${r.appt?"'"+r.appt+"'":'null'},987654321,'zzq','I1_REFUND_REASON_CANARY','I1_REFUND_PROVIDER_CANARY','I1_REFUND_REFERENCE_CANARY','{"I1_REFUND_METADATA_CANARY":true}','rejected','${id(12)}','2047-06-17 12:34:56+00','${id(12)}','2047-06-17 12:34:56+00','2047-06-17 12:34:56+00','failed');`);
  }
  evidence.fixtures={businessA:A,businessB:B,roots,foreignRoot:foreignTx,refunds,seededRefundCounts:{sameBusiness:1,crossBusiness:2,appointmentOnly:2}};
  sql(`create role i1_reader login nosuperuser bypassrls;
       grant usage on schema public to i1_reader;
       grant select on commerce_transactions,commerce_refunds,commerce_payment_attempts,appointments,locations to i1_reader;`);
  evidence.principal=jsonSql(`select json_build_object('role',rolname,'superuser',rolsuper,'bypassrls',rolbypassrls,'refundSelect',has_table_privilege(rolname,'commerce_refunds','select')) from pg_roles where rolname='i1_reader'`);
  assert.equal(evidence.principal.superuser,false);assert.equal(evidence.principal.bypassrls,true);assert.equal(evidence.principal.refundSelect,true);
  evidence.relationships=jsonSql(`select json_agg(json_build_object('name',c.conname,'from',c.conrelid::regclass::text,'to',c.confrelid::regclass::text,'definition',pg_get_constraintdef(c.oid)) order by c.conname) from pg_constraint c where c.contype='f' and c.conrelid in ('commerce_transactions'::regclass,'commerce_refunds'::regclass,'appointments'::regclass)`);
  const hints={transactionWitness:'commerce_refunds_transaction_id_fkey',appointmentWitness:'commerce_refunds_appointment_id_fkey',appointment:'commerce_transactions_appt_business_customer_financial_fk',location:'appointments_location_id_fkey',attempt:'commerce_transactions_attempt_business_fk'};
  for(const n of Object.values(hints))assert(evidence.relationships.some(r=>r.name===n),`Missing catalog FK ${n}`);
  evidence.fkHints=hints;
  const httpPort=await port();
  const config={ 'db-uri':`postgresql:///postgres?host=${encodeURIComponent(socket)}&port=55439&user=i1_reader`, 'db-schemas':'public','db-anon-role':'i1_reader','db-aggregates-enabled':false,'db-plan-enabled':true,'db-config':false,'db-max-rows':100,'db-pool':1,'server-host':'127.0.0.1','server-port':httpPort };
  const configText=Object.entries(config).map(([k,v])=>`${k} = ${JSON.stringify(v)}`).join('\n')+'\n';
  const configPath=join(out,'postgrest.conf');writeFileSync(configPath,configText,{mode:0o600});
  const effective=command(pgrstBin,[configPath,'--dump-config']);
  assert(/db-aggregates-enabled = false/.test(effective));assert(/db-plan-enabled = true/.test(effective));
  writeFileSync(join(out,'effective.conf'),effective);evidence.config=config;evidence.effectiveConfigSha256=sha(effective);evidence.effectiveConfig=effective;
  child=spawn(pgrstBin,[configPath],{env,stdio:['ignore','pipe','pipe']});
  let log='';child.stdout.on('data',b=>{log+=b;appendFileSync(join(out,'postgrest.log'),b);});child.stderr.on('data',b=>{log+=b;appendFileSync(join(out,'postgrest.log'),b);});
  childDone=new Promise((res,rej)=>{child.once('error',rej);child.once('exit',(code,signal)=>res({code,signal}));});
  for(let i=0;i<100&&!/Schema cache loaded/.test(log);i++){assert(!interrupted,'Interrupted');assert(child.exitCode===null,log);await delay(100);}
  assert(/Schema cache loaded/.test(log),`PostgREST startup: ${log}`);
  const select=`id,business_id,customer_id,appointment_id,payment_attempt_id,amount_cents,currency,occurred_at,attempt:commerce_payment_attempts!${hints.attempt}(id,business_id,customer_id,appointment_id,execution_state),appointment:appointments!${hints.appointment}(id,business_id,customer_id,location_id,current_location:locations!${hints.location}(id,business_id),appointment_witness:commerce_refunds!${hints.appointmentWitness}(appointment_id)),transaction_witness:commerce_refunds!${hints.transactionWitness}(transaction_id)`;
  const query=new URLSearchParams({select,business_id:`eq.${A}`,and:'(occurred_at.gte.2032-01-01T00:00:00Z,occurred_at.lt.2032-02-01T00:00:00Z)',order:'id.asc',limit:'100','transaction_witness.limit':'1','appointment.appointment_witness.limit':'1'});
  const url=`http://127.0.0.1:${httpPort}/commerce_transactions?${query}`;
  assert.equal(new URL(url).hostname,'127.0.0.1');
  const headers={Prefer:'count=exact',Accept:'application/json'};
  evidence.request={path:'/commerce_transactions',select,query:query.toString(),headers,dataRequests:1};
  const beforeLog=readFileSync(join(out,'postgres.log'),'utf8').length;
  const response=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(10000)});
  const raw=await response.text();writeFileSync(join(out,'raw-response.json'),raw);evidence.httpStatus=response.status;evidence.contentRange=response.headers.get('content-range');
  assert.equal(response.status,200,raw);const rows=JSON.parse(raw);assert(Array.isArray(rows),raw);evidence.P.P1=true;
  assert.deepEqual(rows.map(r=>r.id),roots.map(r=>r.transaction));assert(!raw.includes(foreignTx));evidence.P.P2=true;
  // Validate exact raw-response-derived object keys before any result mapping.
  function validateWitnesses(payload,total,httpOK=true) {
    if(!httpOK||!Array.isArray(payload)||!Number.isInteger(total)||total!==payload.length)return 'UNKNOWN';
    for(const r of payload){
      if(r.business_id!==A||!r.appointment||r.appointment.id!==r.appointment_id||r.appointment.business_id!==A)return 'UNKNOWN';
      for(const [host,key,field,expected] of [[r,'transaction_witness','transaction_id',r.id],[r.appointment,'appointment_witness','appointment_id',r.appointment.id]]){
        if(!Object.hasOwn(host,key)||!Array.isArray(host[key])||host[key].length>1)return 'UNKNOWN';
        for(const el of host[key])if(!el||typeof el!=='object'||Array.isArray(el)||Object.keys(el).length!==1||!Object.hasOwn(el,field)||el[field]!==expected)return 'UNKNOWN';
      }
    }
    return 'VALID';
  }
  for(const r of rows){assert(Object.hasOwn(r,'transaction_witness'));assert(Object.hasOwn(r.appointment,'appointment_witness'));}
  evidence.P.P3=true;
  for(const r of rows){assert(Array.isArray(r.transaction_witness));assert(Array.isArray(r.appointment.appointment_witness));}
  assert.deepEqual(rows[0].transaction_witness,[]);assert.deepEqual(rows[0].appointment.appointment_witness,[]);evidence.P.P4=true;
  assert.equal(rows[1].transaction_witness.length,1);assert.equal(rows[2].transaction_witness.length,1);assert.equal(rows[3].appointment.appointment_witness.length,1);assert.equal(rows[3].transaction_witness.length,0);evidence.P.P5=true;
  const total=Number(evidence.contentRange?.split('/')[1]);assert.equal(validateWitnesses(rows,total),'VALID');evidence.P.P6=true;
  for(const value of forbidden)assert(!raw.includes(value),`HARD STOP raw privacy: ${value}`);
  evidence.privacy={forbiddenValues:forbidden,forbiddenWitnessFields:['id','business_id','amount_cents','currency','reason','provider','provider_reference','metadata','status','approval_status','approved_by','approved_at','customer_id','created_by','created_at','updated_at','invoice_id','refund_type'],rawScanned:true,unexpectedWitnessKeys:0};evidence.P.P7=true;
  for(const [i,r] of rows.entries()){
    assert.equal(r.attempt.id,roots[i].attempt);assert.equal(r.attempt.business_id,A);assert.equal(r.attempt.customer_id,r.customer_id);assert.equal(r.attempt.appointment_id,r.appointment.id);assert.equal(r.attempt.execution_state,'ACCEPTED');assert.equal(r.appointment.current_location.id,loc);assert.equal(r.appointment.current_location.business_id,A);
  }evidence.P.P8=true;
  await delay(100);
  const statements=readFileSync(join(out,'postgres.log'),'utf8').slice(beforeLog);
  writeFileSync(join(out,'data-request-statements.txt'),statements);
  const dataStatementLines=statements.split('\n').filter(l=>/execute .*WITH pgrst_source AS|statement: WITH pgrst_source AS/.test(l));
  assert.equal(dataStatementLines.length,1,'Expected one generated data statement in PostgreSQL log');
  assert(dataStatementLines[0].includes('commerce_refunds'));assert(dataStatementLines[0].includes('commerce_payment_attempts'));
  const planHeaders={Prefer:'count=exact',Accept:'application/vnd.pgrst.plan+json; for="application/json"; options=verbose'};
  const planResponse=await fetch(url,{headers:planHeaders,redirect:'error',signal:AbortSignal.timeout(10000)});
  const planRaw=await planResponse.text();writeFileSync(join(out,'plan.txt'),planRaw);assert.equal(planResponse.status,200,planRaw);
  const plan=JSON.parse(planRaw);assert(Array.isArray(plan)&&plan.length===1&&plan[0].Plan);
  const nodes=[];function walk(n){nodes.push(n);for(const v of Object.values(n))if(Array.isArray(v))v.forEach(x=>{if(x&&typeof x==='object')walk(x);});}walk(plan[0].Plan);
  for(const table of ['commerce_transactions','commerce_refunds','commerce_payment_attempts','appointments','locations'])assert(nodes.some(n=>n['Relation Name']===table),`Plan missing ${table}`);
  assert(nodes.filter(n=>n['Relation Name']==='commerce_refunds').length>=2);assert(nodes.filter(n=>n['Node Type']==='Limit').length>=2);
  assert.equal(total,roots.length);assert.equal(total,rows.length);assert.equal(evidence.contentRange,'0-3/4');evidence.P.P9=true;
  evidence.plan={accept:planHeaders.Accept,httpStatus:planResponse.status,topLevelPlans:plan.length,dataStatements:1,dataStatementSha256:sha(dataStatementLines[0]),refundScans:nodes.filter(n=>n['Relation Name']==='commerce_refunds').length};
  const malformed = edit => {const copy=structuredClone(rows);edit(copy);assert.equal(validateWitnesses(copy,total),'UNKNOWN');};
  for(const axis of ['transaction','appointment']){
    const host=r=>axis==='transaction'?r:r.appointment,key=axis==='transaction'?'transaction_witness':'appointment_witness',field=axis==='transaction'?'transaction_id':'appointment_id';
    malformed(r=>{delete host(r[0])[key];});
    malformed(r=>{host(r[0])[key]=null;});
    malformed(r=>{host(r[0])[key]=[{[field]:id(999)}];});
    malformed(r=>{host(r[0])[key]=[{[field]:axis==='transaction'?r[0].id:r[0].appointment.id,amount_cents:987654321}];});
  }
  evidence.N={N1:true,N2:true,N3:true,N4:true,N5:/db-aggregates-enabled = false/.test(effective),N6:!select.includes('count('),N7:!/[!]inner|not\.is\.null|is\.null/.test(query.toString())};
  assert.equal(validateWitnesses(rows,total+1),'UNKNOWN');assert.equal(validateWitnesses(rows.slice(1),total),'UNKNOWN');assert.equal(validateWitnesses(rows,total,false),'UNKNOWN');
  evidence.completeness={expected:roots.length,actual:rows.length,total,guards:{C1:true,C2:true,C3:true,C4:query.get('transaction_witness.limit')==='1'&&query.get('appointment.appointment_witness.limit')==='1',C5:true,C6:true},negativeCountMismatch:'UNKNOWN',negativePartial:'UNKNOWN',negativeError:'UNKNOWN'};
  evidence.cardinalities=rows.map((r,i)=>({case:cases[i],transaction:r.transaction_witness.length,appointment:r.appointment.appointment_witness.length}));
  evidence.hashes={rawResponse:sha(raw),plan:sha(planRaw)};
  assert(Object.values(evidence.N).every(Boolean));
  evidence.verdict='SLICE2A_I1_LOCAL_POSTGREST_PROOF_PASS';
} catch(e){evidence.verdict='NOT_PASS';evidence.error=String(e);console.error(String(e));process.exitCode=1;}
finally {
  if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');const result=await Promise.race([childDone,delay(5000).then(()=>null)]);if(!result){child.kill('SIGKILL');await childDone;}}
  evidence.cleanup.postgrestStopped=!child||child.exitCode!==null||child.signalCode!==null;
  if(started){
    try {command(join(pgBin,'pg_ctl'),['-D',data,'-w','stop','-m','fast']);const check=spawnSync(join(pgBin,'pg_ctl'),['-D',data,'status'],{env,encoding:'utf8'});assert.equal(check.status,3);evidence.cleanup.postgresStopped=true;}catch(e){evidence.cleanup.error=String(e);process.exitCode=1;}
  }
  if(evidence.cleanup.postgresStopped){assert.equal(readFileSync(join(data,'.i1-owned'),'utf8'),marker);assert.equal(realpathSync(data),out+'/pgdata');rmSync(data,{recursive:true});evidence.cleanup.ownedPgdataRemoved=!existsSync(data);}
  if(!evidence.cleanup.postgrestStopped||!evidence.cleanup.postgresStopped||!evidence.cleanup.ownedPgdataRemoved){evidence.verdict='NOT_PASS';process.exitCode=1;}
  if(interrupted){evidence.verdict='NOT_PASS';evidence.error='Interrupted';process.exitCode=1;}
  process.removeListener('SIGINT',interrupt);process.removeListener('SIGTERM',interrupt);
  writeFileSync(join(out,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  console.log(JSON.stringify({out,verdict:evidence.verdict,P:evidence.P,N:evidence.N,cleanup:evidence.cleanup},null,2));
}
