// Local-only successor verification. No fetch, publication, hosted data or deployment.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readlinkSync, existsSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const parent='8a68ae0cd5b3c517c42dda0aa197c5bb475fa96a';
const parentTree='21fa9685ae946aff898ce91cb1e84efbecbb8602';
const securityParent='0325195793f9351cff52619230dea797b6946363';
const original='9f305c2f9a377b95aa1642a3dc69f70cc0cb4573';
const production='664fbc734c4103d78484c6b3828849a6605a562f';
const verifierPath='scripts/verify-reception-isolation.mjs';
const historicalVerifierBlob='507fa535275e28206ac991df014b3d010f145902';
const verifierDigest='5c1a15db43ee696072a4ed2cc4d87c2559cf0321b0fca2304933e41db27092e8';
const approvedBlobs=new Map([
 ['tests/unit/dashboard/m1c-reception-compatibility.test.tsx','e850e10e88d4fc4e9558561c483497b2723ff8ab'],
]);
const allowed=[...approvedBlobs.keys(),verifierPath].sort();
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
assert.equal(git('show','-s','--format=%P',parent),securityParent,'Historical security ancestry changed');
assert.equal(git('rev-list','--count',securityParent+'..'+parent),'1','Historical security correction must remain one child');
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
assert.deepEqual(untracked,[],'Unexpected untracked files');

const tree=ref=>new Map(git('ls-tree','-r','-z',ref).split('\0').filter(Boolean).map(entry=>{
 const tab=entry.indexOf('\t');
 const [mode,type,blob]=entry.slice(0,tab).split(' ');
 assert.equal(type,'blob','Non-blob tree entry forbidden');
 return [entry.slice(tab+1),{mode,blob}];
}));
const parentFiles=tree(parent);
for(const path of allowed) assert(parentFiles.has(path),'Authorized file must already exist: '+path);
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
 if(!allowed.includes(path)) assert.equal(actual,blob,'Protected source changed: '+path);
}
assert.deepEqual(changed.sort(),allowed,'Only the two exact authorized files may change');
for(const [path,blob] of approvedBlobs) assert.equal(actualBlob(path,'100644'),blob,'Unapproved successor content: '+path);
const source=readFileSync(verifierPath,'utf8');
const normalized=source.replace(/const verifierDigest='[0-9a-f]{64}';/,"const verifierDigest='NORMALIZED_DIGEST';");
assert.equal(createHash('sha256').update(normalized).digest('hex'),verifierDigest,'Unapproved verifier content');
if(!precommit) {
 const committed=tree('HEAD');
 assert.deepEqual([...committed.keys()].sort(),[...parentFiles.keys()].sort(),'Committed file inventory changed');
 for(const [path,{mode,blob}] of committed) {
  assert.equal(mode,parentFiles.get(path).mode,'Committed mode changed: '+path);
  assert.equal(actualBlob(path,mode),blob,'Committed bytes differ: '+path);
 }
 const delta=git('diff','--raw','--no-abbrev','--no-renames',parent,'HEAD').split('\n');
 assert.deepEqual(delta.map(line=>line.split('\t')[1]).sort(),allowed,'Committed delta changed');
 for(const line of delta) {
  assert.match(line,/^:100644 100644 [0-9a-f]{40} [0-9a-f]{40} M\t/,'Addition/rename/deletion/mode change forbidden');
 }
}
assert.equal(JSON.parse(readFileSync('release/candidates.json','utf8')).candidates.length,0,'Registry must remain deny-all');

// Preserve ALL historical assertions without rewriting them for new dependencies.
// Execute the pinned security verifier against its clean immutable source. It in
// turn executes the pinned harness verifier, retaining the entire historical chain.
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
 assert.equal(historicalProof.head,parent,'Historical proof must verify the exact security parent');
 assert.equal(historicalProof.parent,securityParent,'Historical proof ancestry changed');
 assert.equal(historicalProof.historicalVerification,'PASS','Historical harness verification must pass');
} finally {
 rmSync(historicalRoot,{recursive:true,force:true});
}
console.log(JSON.stringify({mode:precommit?'PRECOMMIT_ONLY':'COMMITTED_DIAGNOSTIC_CHILD',head,parent,parentTree,original,historicalVerifierBlob,historicalVerification:'PASS',historicalProof,changedFiles:allowed,protectedSourceFiles:parentFiles.size-allowed.length,registry:'DENY_ALL'}));
