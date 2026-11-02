// Local-only successor verification. No fetch, publication, hosted data or deployment.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readlinkSync, existsSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const parent='9f83b4de9c4e62ce6b1bc26e39b6356f621f8570';
const parentTree='bbe6789c7c04a5a313362c78d3ae9aa0cb85a7f0';
const historicalParent='8a68ae0cd5b3c517c42dda0aa197c5bb475fa96a';
const original='9f305c2f9a377b95aa1642a3dc69f70cc0cb4573';
const production='664fbc734c4103d78484c6b3828849a6605a562f';
const verifierPath='scripts/verify-reception-isolation.mjs';
const historicalVerifierBlob='575a0a30bfcacc25b8f3184135a553ccbb805a82';
const verifierDigest='16607291aabe16ceb567bc985d89f8782d811cef3ff493ea23fdfb7f74dc2438';
const approvedBlobs=new Map([
 ['app/(auth)/access-denied/page.tsx','6654e1586903e7cbfc67f6d5596b836de3c4e606'],
 ['components/auth/access-denied-sign-out.tsx','665cbd7b2200ead6cab28f4a3854f0d39218817a'],
 ['components/dashboard/sidebar.tsx','1aabff1dd4ed2758163a343f2fb97db427419e06'],
 ['components/owner/shell.tsx','7802e3712d4932846b4a376f587aca663ea6049d'],
 ['lib/actions/auth.ts','7bfe2cc9a7a2478235632eee53b19783c7e89354'],
 ['tests/unit/auth/sign-out-error-handling.test.ts','adf785cd94485d90594ff2a5d392b7ea4d2ba6f6'],
]);
const added=new Set([
 'components/auth/access-denied-sign-out.tsx',
 'tests/unit/auth/sign-out-error-handling.test.ts',
]);
const allowed=[...approvedBlobs.keys(),verifierPath].sort();
const existingAllowed=allowed.filter(path=>!added.has(path));
const precommit=process.argv.length===3 && process.argv[2]==='--check-worktree';
assert(precommit || process.argv.length===2,'Unsupported verifier arguments');
// Ignore injected Git environment/config; never consult remote services or hooks.
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('GIT_')));
Object.assign(env,{GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_TERMINAL_PROMPT:'0'});
const gitAt=(cwd,...args)=>execFileSync('git',['--no-replace-objects','-c','core.hooksPath=/dev/null','-c','core.fsmonitor=false',...args],{cwd,env,encoding:'utf8'}).trim();
const root=gitAt(process.cwd(),'rev-parse','--show-toplevel');
const git=(...args)=>gitAt(root,...args);
assert.equal(resolve(process.cwd()),root,'Run from the repository root');
assert.equal(fileURLToPath(import.meta.url),join(root,verifierPath),'Run the checked-out verifier');
assert.equal(git('rev-parse','--is-shallow-repository'),'false','Complete history required');
assert.equal(git('for-each-ref','refs/replace'),'','Replacement refs are forbidden');
assert(!existsSync(git('rev-parse','--git-path','info/grafts')),'Grafted history is forbidden');
assert.equal(git('rev-parse',parent+'^{tree}'),parentTree,'Immutable parent tree changed');
assert.equal(git('show','-s','--format=%P',parent),historicalParent,'Historical diagnostic ancestry changed');
assert.equal(git('rev-list','--count',historicalParent+'..'+parent),'1','Historical diagnostic correction must remain one child');
assert.equal(git('rev-parse',parent+':'+verifierPath),historicalVerifierBlob,'Historical verifier source changed');
git('merge-base','--is-ancestor',production,parent);
const head=git('rev-parse','HEAD');
if(precommit) {
 assert.equal(head,parent,'Precommit requires the exact approved parent');
 assert.equal(git('diff','--cached','--name-only'),'','Precommit requires an unchanged index');
} else {
 assert.equal(git('show','-s','--format=%P','HEAD'),parent,'Successor must have the exact sole parent');
 assert.equal(git('rev-list','--count',parent+'..HEAD'),'1','Extra descendants forbidden');
 assert.equal(git('status','--porcelain=v1','--untracked-files=all'),'','Committed successor must be clean');
}
const untracked=git('ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
assert.deepEqual(untracked.sort(),precommit?[...added].sort():[],'Unexpected untracked files');

const tree=ref=>new Map(git('ls-tree','-r','-z',ref).split('\0').filter(Boolean).map(entry=>{
 const tab=entry.indexOf('\t');
 const [mode,type,blob]=entry.slice(0,tab).split(' ');
 assert.equal(type,'blob','Non-blob tree entry forbidden');
 return [entry.slice(tab+1),{mode,blob}];
}));
const parentFiles=tree(parent);
for(const path of existingAllowed) assert(parentFiles.has(path),'Authorized file must already exist: '+path);
for(const path of added) assert(!parentFiles.has(path),'Authorized addition must not exist in parent: '+path);
const actualBlob=(path,mode)=>{
 const stat=lstatSync(path);
 assert(mode==='120000'?stat.isSymbolicLink():stat.isFile()&&!stat.isSymbolicLink(),'Invalid file type: '+path);
 if(mode!=='120000') assert.equal(Boolean(stat.mode&0o111),mode==='100755','File mode changed: '+path);
 const bytes=mode==='120000'?Buffer.from(readlinkSync(path)):readFileSync(path);
 return createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
};
// Read bytes/modes directly: index stat caches and assume-unchanged flags cannot hide edits.
const changed=[];
for(const [path,{mode,blob}] of parentFiles) {
 const actual=actualBlob(path,mode);
 if(actual!==blob) changed.push(path);
 if(!existingAllowed.includes(path)) assert.equal(actual,blob,'Protected source changed: '+path);
}
assert.deepEqual(changed.sort(),existingAllowed,'Only the exact authorized existing files may change');
for(const [path,blob] of approvedBlobs) assert.equal(actualBlob(path,'100644'),blob,'Unapproved successor content: '+path);
const source=readFileSync(verifierPath,'utf8');
const normalized=source.replace(/const verifierDigest='[0-9a-f]{64}';/,"const verifierDigest='NORMALIZED_DIGEST';");
assert.equal(createHash('sha256').update(normalized).digest('hex'),verifierDigest,'Unapproved verifier content');
if(!precommit) {
 const committed=tree('HEAD');
 const expectedInventory=[...parentFiles.keys(),...added].sort();
 assert.deepEqual([...committed.keys()].sort(),expectedInventory,'Committed file inventory changed');
 for(const [path,{mode,blob}] of committed) {
  const parentEntry=parentFiles.get(path);
  if(parentEntry) assert.equal(mode,parentEntry.mode,'Committed mode changed: '+path);
  else {
   assert(added.has(path),'Unexpected committed addition: '+path);
   assert.equal(mode,'100644','Committed addition mode changed: '+path);
  }
  assert.equal(actualBlob(path,mode),blob,'Committed bytes differ: '+path);
 }
 const delta=git('diff','--raw','--no-abbrev','--no-renames',parent,'HEAD').split('\n');
 assert.deepEqual(delta.map(line=>line.split('\t')[1]).sort(),allowed,'Committed delta changed');
 for(const line of delta) {
  const path=line.split('\t')[1];
  if(added.has(path)) {
   assert.match(line,/^:000000 100644 0{40} [0-9a-f]{40} A\t/,'Authorized addition changed');
  } else {
   assert.match(line,/^:100644 100644 [0-9a-f]{40} [0-9a-f]{40} M\t/,'Modification/rename/deletion/mode change forbidden');
  }
 }
}
assert.equal(JSON.parse(readFileSync('release/candidates.json','utf8')).candidates.length,0,'Registry must remain deny-all');

// Preserve ALL historical assertions without rewriting them for new dependencies.
// Execute the pinned diagnostic verifier against its clean immutable source. It
// retains the full security and harness chain behind this bounded correction.
// Only disposable local clones are written and then removed.
const historicalRoot=mkdtempSync(join(tmpdir(),'chasum-historical-isolation-'));
let historicalProof;
try {
 const checkout=join(historicalRoot,'parent');
 gitAt(root,'-c','init.templateDir=','clone','--quiet','--shared','--no-checkout',root,checkout);
 gitAt(checkout,'checkout','--quiet','--detach',parent);
 assert.equal(gitAt(checkout,'rev-parse','HEAD'),parent);
 assert.equal(gitAt(checkout,'hash-object',verifierPath),historicalVerifierBlob);
 historicalProof=JSON.parse(execFileSync(process.execPath,[verifierPath],{cwd:checkout,env,encoding:'utf8',stdio:'pipe'}));
 assert.equal(historicalProof.head,parent,'Historical proof must verify the exact diagnostic parent');
 assert.equal(historicalProof.parent,historicalParent,'Historical proof ancestry changed');
 assert.equal(historicalProof.historicalVerification,'PASS','Historical harness verification must pass');
} finally {
 rmSync(historicalRoot,{recursive:true,force:true});
}
console.log(JSON.stringify({mode:precommit?'PRECOMMIT_ONLY':'COMMITTED_SIGN_OUT_CHILD',head,parent,parentTree,original,historicalVerifierBlob,historicalVerification:'PASS',historicalProof,changedFiles:allowed,protectedSourceFiles:parentFiles.size-existingAllowed.length,registry:'DENY_ALL'}));
