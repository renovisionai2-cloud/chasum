// Local-only successor verification. No fetch, publication, hosted data or deployment.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readlinkSync, existsSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const parent='99d5f89b8ecc08abeefb3024f6c7187530482853';
const parentTree='7975d8cb8019e89053104bece37e86449beca1ef';
const historicalParent='9f83b4de9c4e62ce6b1bc26e39b6356f621f8570';
const original='9f305c2f9a377b95aa1642a3dc69f70cc0cb4573';
const production='664fbc734c4103d78484c6b3828849a6605a562f';
const verifierPath='scripts/verify-reception-isolation.mjs';
const historicalVerifierBlob='6fe847e14cfb63db722fa7e80fa82b5a943ff002';
const verifierDigest='317359258f286acdea74df6a42eee797621301138938ef47b30a49b4d934a49e';
const approvedBlobs=new Map([
 ['lib/supabase/server.ts','63f94e2eb83a9f2ef08b7aab914608c5e6362cb7'],
 ['tests/unit/auth/supabase-cookie-adapter.test.ts','1f5d75421014226f4e936b181f2598dcf181d8c9'],
]);
const added=new Set([
 'tests/unit/auth/supabase-cookie-adapter.test.ts',
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
assert.equal(git('show','-s','--format=%P',parent),historicalParent,'Historical sign-out ancestry changed');
assert.equal(git('rev-list','--count',historicalParent+'..'+parent),'1','Historical sign-out correction must remain one child');
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
// Execute the pinned sign-out verifier against its clean immutable source. It
// retains the diagnostic, security and harness chain behind this correction.
// Only a disposable detached worktree is written and then removed. Sharing the
// existing object database preserves unreachable objects required by historical
// proofs without adding another alternate-object-store nesting level.
const historicalRoot=mkdtempSync(join(tmpdir(),'chasum-historical-isolation-'));
let historicalProof;
let worktreeAdded=false;
try {
 const checkout=join(historicalRoot,'parent');
 gitAt(root,'worktree','add','--quiet','--detach',checkout,parent);
 worktreeAdded=true;
 assert.equal(gitAt(checkout,'rev-parse','HEAD'),parent);
 assert.equal(gitAt(checkout,'hash-object',verifierPath),historicalVerifierBlob);
 historicalProof=JSON.parse(execFileSync(process.execPath,[verifierPath],{cwd:checkout,env,encoding:'utf8',stdio:'pipe'}));
 assert.equal(historicalProof.head,parent,'Historical proof must verify the exact sign-out parent');
 assert.equal(historicalProof.parent,historicalParent,'Historical proof ancestry changed');
 assert.equal(historicalProof.historicalVerification,'PASS','Historical harness verification must pass');
} finally {
 if(worktreeAdded) gitAt(root,'worktree','remove','--force',join(historicalRoot,'parent'));
 rmSync(historicalRoot,{recursive:true,force:true});
}
console.log(JSON.stringify({mode:precommit?'PRECOMMIT_ONLY':'COMMITTED_COOKIE_CLEANUP_CHILD',head,parent,parentTree,original,historicalVerifierBlob,historicalVerification:'PASS',historicalProof,changedFiles:allowed,protectedSourceFiles:parentFiles.size-existingAllowed.length,registry:'DENY_ALL'}));
