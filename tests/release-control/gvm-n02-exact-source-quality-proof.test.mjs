import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { test, after } from 'node:test';

// js-yaml is already locked through ESLint. No package/lockfile change.
const { load } = createRequire(import.meta.url)('js-yaml');
const path = new URL('../../.github/workflows/gvm-n02-exact-source-quality-proof.yml', import.meta.url);
const workflow = load(readFileSync(path, 'utf8'));
const steps = workflow.jobs['n02-exact-source-proof'].steps;
const proof = steps.find(s => s.id === 'proof').run;
const controller = proof.split("<<'N02_CONTROLLER'\n")[1].split('\nN02_CONTROLLER\n')[0];
const temp = mkdtempSync(join(tmpdir(), 'n02-control-tests-'));
const modulePath = join(temp, 'controller.py');
writeFileSync(modulePath, controller);
after(() => rmSync(temp, { recursive: true, force: true }));
const sha256 = text => createHash('sha256').update(text).digest('hex');
const CHECKOUT = 'actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683';
const NODE = 'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020';
const UPLOAD = 'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02';
const SHA = '89f801b7974f1c8348909b06ae326e6d72c56bb4';
const TREE = 'df59a150ac2a44e9f6bd54564ec9756d40503e1e';
const PARENT = 'b39b2e7ba579e58e0865c139ca1f2ee503c0e8ac';
// Fingerprints lock all executable controls, not just a permissive keyword scan.
// Changing them requires a new reviewed control candidate; application source stays fixed.
const RUN_HASHES = ["5b3b8e2569fdbfb7eacc138bbe0848733ddfb40703e32561c4778cebd88ca30e","d25fa8d921a82086f3136e6051d19db69a3c28ad1f6ef0c9b15c5410c3561675","660c3deff884efa5a88da410ecfb93614bfcd8ff3cbcfd32347bbec49b53e535"];
function verifyWorkflow(w) {
  assert.deepEqual(Object.keys(w).sort(), ['concurrency','jobs','name','on','permissions']);
  assert.equal(w.name, 'GVM N02 exact-source Quality proof');
  assert.deepEqual(w.on, { workflow_dispatch: { inputs: { approved_control_sha: {
    description: 'Independently reviewed exact control SHA approved for this execution', type: 'string', required: true,
  } } } });
  assert.deepEqual(w.permissions, { contents: 'read' });
  assert.deepEqual(w.concurrency, { group:'gvm-n02-exact-source-proof', 'cancel-in-progress':false });
  assert.deepEqual(Object.keys(w.jobs), ['n02-exact-source-proof']);
  const j = w.jobs['n02-exact-source-proof'];
  assert.deepEqual(Object.keys(j).sort(), ['defaults','env','name','runs-on','steps','timeout-minutes']);
  assert.equal(j.name, 'n02-exact-source-proof');
  assert.equal(j['runs-on'], 'ubuntu-24.04');
  assert.equal(j['timeout-minutes'], 60);
  assert.deepEqual(j.defaults, { run:{ shell:'bash' } });
  assert.deepEqual(j.env, {
    APPROVED_CONTROL_SHA:'${{ inputs.approved_control_sha }}',
    TRUSTED_WORKFLOW_SHA:'${{ github.workflow_sha }}',
    TRUSTED_WORKFLOW_REF:'${{ github.workflow_ref }}',
    PROOF_CHECK_RUN_ID:'${{ job.check_run_id }}',
  });
  const [guard, controls, candidate, node, execute, upload, receipt] = j.steps;
  assert.equal(j.steps.length,7);
  const actualActions = j.steps.filter(s=>s.uses).map(s=>s.uses);
  assert.deepEqual(actualActions,[CHECKOUT,CHECKOUT,NODE,UPLOAD]);
  assert.deepEqual(controls,{name:'Checkout reviewed controls',uses:CHECKOUT,with:{ref:'${{ github.sha }}',path:'controls','persist-credentials':false}});
  assert.deepEqual(candidate,{name:'Checkout literal audited application',uses:CHECKOUT,with:{ref:SHA,path:'candidate','fetch-depth':2,'persist-credentials':false}});
  assert.deepEqual(node,{name:'Set up Node 22 without shared caches',uses:NODE,with:{'node-version':'22.23.4'}});
  assert.deepEqual(Object.keys(guard).sort(),['name','run']);
  assert.deepEqual(Object.keys(execute).sort(),['id','name','run']);
  assert.equal(execute.id,'proof');
  assert.deepEqual([guard.run,execute.run,receipt.run].map(sha256),RUN_HASHES);
  assert.deepEqual(upload,{name:'Upload bounded evidence including failures',id:'evidence',if:'always()',uses:UPLOAD,
    with:{name:'n02-proof-${{ github.run_id }}-${{ github.run_attempt }}',path:'${{ runner.temp }}/n02-proof/publish/',
      'if-no-files-found':'error','retention-days':14,'include-hidden-files':false}});
  assert.deepEqual(Object.keys(receipt).sort(),['env','if','name','run']);
  assert.equal(receipt.if,'always()');
  assert.deepEqual(receipt.env,{
    PROOF_OUTCOME:'${{ steps.proof.outcome }}',UPLOAD_OUTCOME:'${{ steps.evidence.outcome }}',
    ARTIFACT_ID:'${{ steps.evidence.outputs.artifact-id }}',ARTIFACT_DIGEST:'${{ steps.evidence.outputs.artifact-digest }}',
    ARTIFACT_URL:'${{ steps.evidence.outputs.artifact-url }}',
  });
}

// Execute the SAME embedded validators on synthetic data, never the Linux driver.
// These tests do not start Docker, npm/build/test commands, network probes or browsers.
function python(body, data = {}) {
  const result = spawnSync('python3',['-I','-c',`import importlib.util,json,sys\ns=importlib.util.spec_from_file_location('c',sys.argv[1])\nc=importlib.util.module_from_spec(s);s.loader.exec_module(c)\nd=json.loads(sys.stdin.read())\n${body}`,modulePath],
    {input:JSON.stringify(data),encoding:'utf8',timeout:15000});
  assert.equal(result.error,undefined);
  return result;
}
function pass(body,data) {const r=python(body,data); assert.equal(r.status,0,r.stderr); return r.stdout;}
function reject(body,data) {const r=python(body,data); assert.notEqual(r.status,0,'unsafe control accepted'); assert.match(r.stderr,/RuntimeError/);}
const identity={sha:SHA,tree:TREE,parents:[PARENT],clean:true};
const dispatch={repository:'renovisionai2-cloud/chasum',event:'workflow_dispatch',ref:'refs/heads/main',
  control_sha:'a'.repeat(40),workflow_sha:'a'.repeat(40),approved_control_sha:'a'.repeat(40),
  workflow_ref:'renovisionai2-cloud/chasum/.github/workflows/gvm-n02-exact-source-quality-proof.yml@refs/heads/main',
  attempt:'1',runner_os:'Linux',runner_environment:'github-hosted'};

test('structural: exact two-checkout manual proof; no required-check impersonation',()=>verifyWorkflow(workflow));
for (const [name,mutate] of [
  ['write token',w=>w.permissions.contents='write'],
  ['OIDC authority',w=>w.permissions['id-token']='write'],
  ['Production Environment',w=>w.jobs['n02-exact-source-proof'].environment='production-release'],
  ['secret injection',w=>w.jobs['n02-exact-source-proof'].env.VERCEL_TOKEN='${{ secrets.VERCEL_TOKEN }}'],
  ['deployment action',w=>w.jobs['n02-exact-source-proof'].steps.push({uses:'amondnet/vercel-action@v25'})],
  ['required job name',w=>w.jobs['n02-exact-source-proof'].name='quality'],
  ['required job key',w=>{w.jobs.quality=w.jobs['n02-exact-source-proof'];delete w.jobs['n02-exact-source-proof'];}],
  ['synthetic merge',w=>w.jobs['n02-exact-source-proof'].steps[2].with.ref='refs/pull/195/merge'],
  ['moving source',w=>w.jobs['n02-exact-source-proof'].steps[2].with.ref='main'],
  ['credential persistence',w=>w.jobs['n02-exact-source-proof'].steps[2].with['persist-credentials']=true],
  ['shared cache',w=>w.jobs['n02-exact-source-proof'].steps[3].with.cache='npm'],
  ['soft test failure',w=>w.jobs['n02-exact-source-proof'].steps[4]['continue-on-error']=true],
  ['conditional execution',w=>w.jobs['n02-exact-source-proof'].steps[4].if='false'],
  ['extra execution',w=>w.jobs['n02-exact-source-proof'].steps[4].run+='\nvercel --prod'],
  ['missing artifact failure',w=>w.jobs['n02-exact-source-proof'].steps[5].with['if-no-files-found']='warn'],
  ['upload failure ignored',w=>w.jobs['n02-exact-source-proof'].steps[5]['continue-on-error']=true],
  ['extra trigger',w=>w.on.push={}],
]) test(`structural negative: rejects ${name}`,()=>{const w=structuredClone(workflow);mutate(w);assert.throws(()=>verifyWorkflow(w));});

test('embedded candidate identity accepts exact synthetic tuple',()=>pass('c.validate_identity(d)',identity));
for(const [key,value] of [['sha','b'.repeat(40)],['tree','b'.repeat(40)],['parents',['b'.repeat(40)]],['parents',[PARENT,'b'.repeat(40)]],['clean',false]]) {
  test(`identity negative: ${key}=${JSON.stringify(value)}`,()=>reject('c.validate_identity(d)',{...identity,[key]:value}));
}
test('dispatch accepts approved synthetic control tuple',()=>pass('c.validate_dispatch(d)',dispatch));
for(const [key,value] of [['repository','other/repo'],['control_sha','b'.repeat(40)],['workflow_sha','b'.repeat(40)],
  ['approved_control_sha','main'],['ref','refs/pull/195/merge'],['event','push'],['attempt','2'],['runner_os','Darwin'],['runner_environment','self-hosted']]) {
  test(`dispatch negative: rejects ${key}`,()=>reject('c.validate_dispatch(d)',{...dispatch,[key]:value}));
}
test('embedded Python syntax, plan and Node 22 declarations',()=>pass("c.validate_plan(c.STAGES)\nassert c.NODE.split('.')[0]=='22'"));
test('embedded probe parses and uses the actual child path and writable browser registry',()=>{
  const source=pass('print(c.PROBE_JS)');
  assert.match(source,/\['\/inputs\/probe\.mjs', 'child'\]/);
  assert.match(source,/PLAYWRIGHT_BROWSERS_PATH: '\/work\/browsers'/);
  const file=join(temp,'probe.mjs');writeFileSync(file,source);
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});
test('font manifest CSS hashes and fixed asset URL inventory match',()=>pass(`
urls=set()
for css in c.FONT_LOCK['stylesheets']:
    assert c.sha256(css['body'].encode()) == css['sha256']
    urls.update(c.re.findall(r'url\\((https://[^)]+)\\)',css['body']))
assert urls == {a['url'] for a in c.FONT_LOCK['assets']}
assert all(c.re.fullmatch('[0-9a-f]{64}',a['sha256']) for a in c.FONT_LOCK['assets'])
`));
for(const [name,edit] of [
  ['missing WebKit',"p[5][1].remove('webkit')"],['missing Chromium',"p[5][1].remove('chromium')"],
  ['test before CSS build','p[4],p[6]=p[6],p[4]'],['missing browser install','p.pop(5)'],
  ['focused suite substitution',"p[6][1].append('tests/unit/booking')"],['build retry',"p[4][1][:]=['bash','-c','npm run build || npm run build']"],
]) test(`execution plan negative: ${name}`,()=>reject(`p=c.copy.deepcopy(c.STAGES)\n${edit}\nc.validate_plan(p)`));

const mounts={'/inputs':['/safe/inputs',false],'/node':['/safe/node',false],'/out':['/safe/out',true]};
const inspected={HostConfig:{NetworkMode:'none',Privileged:false,ReadonlyRootfs:true,CapDrop:['ALL'],CapAdd:null,
  SecurityOpt:['no-new-privileges'],PidMode:'',IpcMode:'private',Devices:[],PortBindings:{}},Config:{User:'1000:1000'},
  Mounts:Object.entries(mounts).map(([Destination,[Source,RW]])=>({Type:'bind',Destination,Source,RW}))};
const inspectBody="c.validate_container(d['inspection'],{k:tuple(v) for k,v in d['mounts'].items()})";
test('structural container inspection accepts synthetic restricted configuration',()=>pass(inspectBody,{inspection:inspected,mounts}));
for(const [name,mutate] of [
  ['network removed',d=>d.HostConfig.NetworkMode='bridge'],['privileged',d=>d.HostConfig.Privileged=true],
  ['root',d=>d.Config.User='0:0'],['capability',d=>d.HostConfig.CapAdd=['NET_ADMIN']],
  ['seccomp bypass',d=>d.HostConfig.SecurityOpt.push('seccomp=unconfined')],
  ['host pid namespace',d=>d.HostConfig.PidMode='host'],['host socket mount',d=>d.Mounts.push({Type:'bind',Destination:'/var/run/docker.sock',Source:'/var/run/docker.sock',RW:true})],
  ['writable inputs',d=>d.Mounts[0].RW=true],
  ['unexpected volume',d=>d.Mounts.push({Type:'volume',Destination:'/secret',Source:'unknown',RW:true})],
]) test(`container declaration negative: ${name}`,()=>{const d=structuredClone(inspected);mutate(d);reject(inspectBody,{inspection:d,mounts});});

function fixture() {
  const browser='tests/unit/booking/custom-payment-amount-browser.test.ts';
  const skip='tests/integration/package-a-availability-postgres.test.ts';
  const metrics=[];
  for(const engine of ['chromium','webkit'])for(const width of [320,390,834,1280])for(const theme of ['light','dark'])metrics.push({engine,width,theme,errors:[],external:[],writes:[]});
  const suites=[{name:'/work/'+browser,assertionResults:metrics.map(m=>({fullName:`${m.engine} ${m.width} ${m.theme}`,status:'passed'}))},
    {name:'/work/tests/unit/synthetic.test.ts',assertionResults:Array.from({length:2026},(_,i)=>({fullName:`synthetic ${i}`,status:'passed'}))},
    {name:'/work/'+skip,assertionResults:Array.from({length:36},(_,i)=>({fullName:`conditional ${i}`,status:'pending'}))}];
  return {r:{success:true,numFailedTests:0,numFailedTestSuites:0,numPendingTests:36,numPassedTests:2042,numTotalTests:2078,testResults:suites},
    expected_files:suites.map(s=>s.name.slice(6)),metrics,
    cleanup:['CHROMIUM','WEBKIT','HTTP_SERVER'].flatMap(component=>['BEGIN','COMPLETE'].map(event=>'[n02-teardown] '+JSON.stringify({event:component+'_CLOSE_'+event,status:'completed'}))).join('\n')};
}
const resultBody="c.validate_results(d['r'],d['expected_files'],d['metrics'],d['cleanup'])";
test('assessment accepts complete synthetic reports, not real test evidence',()=>pass(resultBody,fixture()));
for(const [name,mutate] of [
  ['skipped browser',d=>d.r.testResults[0].assertionResults[0].status='pending'],
  ['missing browser case',d=>d.r.testResults[0].assertionResults.pop()],
  ['missing required file',d=>d.r.testResults.splice(1,1)],
  ['missing case concealed by summary totals',d=>d.r.testResults[1].assertionResults.pop()],
  ['failed command report',d=>d.r.success=false],['test failure',d=>d.r.numFailedTests=1],
  ['missing metrics',d=>d.metrics.pop()],['external request',d=>d.metrics[0].external.push('synthetic.invalid')],
  ['cleanup failure',d=>d.cleanup+='\n[n02-teardown] '+JSON.stringify({event:'WEBKIT_CLOSE_ERROR'})],
  ['cleanup missing',d=>d.cleanup=d.cleanup.split('\n').slice(0,-1).join('\n')],
  ['new conditional skips',d=>d.r.numPendingTests=37],
]) test(`assessment negative: ${name}`,()=>{const d=fixture();mutate(d);reject(resultBody,d);});

const outcome={status:'PASS',stages:['install','release-config','release-tests','typecheck','build','browser-install','vitest'],
  exit_code:0,oom:false,container_removed:true,source_after:true,receiver_hits:[]};
test('outcome accepts complete synthetic stage/termination record',()=>pass('c.validate_outcome(d)',outcome));
for(const [key,value] of [['status','FAIL'],['exit_code',1],['oom',true],['container_removed',false],['source_after',false],['receiver_hits',['http']],['stages',[]]]) {
  test(`outcome negative: ${key}`,()=>reject('c.validate_outcome(d)',{...outcome,[key]:value}));
}
test('release report requires all 26 tests and no skipped/failing tests',()=>pass("c.validate_release(d['log'])",{log:'# tests 26\n# pass 26\n# fail 0\n# cancelled 0\n# skipped 0\n# todo 0\n'}));
test('release report fails closed on absent evidence',()=>reject("c.validate_release(d['log'])",{log:''}));
test('artifact receipt accepts synthetic successful upload identity',()=>pass("c.validate_receipt('success','success','123','a'*64)"));
for(const expr of ["'failure','success','123','a'*64","'success','failure','123','a'*64","'success','skipped','123','a'*64","'success','success','','a'*64","'success','success','123',''"]) {
  test(`artifact receipt negative: ${expr}`,()=>reject(`c.validate_receipt(${expr})`));
}
test('actual command failure is not converted to success',()=>reject("c.command([sys.executable,'-c','raise SystemExit(7)'])"));
test('source preservation verifier rejects a changed synthetic source file',()=>reject("p=c.pathlib.Path(d['path']);p.write_text('changed');c.verify_bytes(p.parent,{p.name:c.sha256(b'original')})",{path:join(temp,'source.txt')}));
test('bounded sanitizer rejects symlink traversal',()=>reject("r=c.pathlib.Path(d['root']);r.mkdir();(r/'escape.log').symlink_to('/etc/hosts');c.sanitized_copy(r,r.parent/'published')",{root:join(temp,'symlinks')}));
test('staged public input accepts only a contained relative symlink',()=>pass("r=c.pathlib.Path(d['root']);r.mkdir();(r/'library').write_text('synthetic');(r/'link').symlink_to('library');c.prepare_inputs(r)",{root:join(temp,'inputs-safe')}));
test('staged public input rejects an escaping symlink',()=>reject("r=c.pathlib.Path(d['root']);r.mkdir();(r/'link').symlink_to('/etc/hosts');c.prepare_inputs(r)",{root:join(temp,'inputs-unsafe')}));

for(const name of ['Linux kernel network-none behavior','external and child-process egress denial',
  'removed-network Linux canary','Chromium/WebKit network and loopback probes','Linux Node 22 complete Quality and cleanup']) {
  test(name,{skip:'NOT RUN — REQUIRES LINUX EXECUTION'},()=>{});
}
