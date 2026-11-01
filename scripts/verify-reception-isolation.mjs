// Local-only successor verification. No fetch, publication, hosted data or deployment.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readlinkSync, existsSync, lstatSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const parent='0325195793f9351cff52619230dea797b6946363';
const parentTree='6f8786be0ea2e66e9543e4651d33c843995bc7b4';
const original='9f305c2f9a377b95aa1642a3dc69f70cc0cb4573';
const production='664fbc734c4103d78484c6b3828849a6605a562f';
const verifierPath='scripts/verify-reception-isolation.mjs';
const historicalVerifierBlob='1058d3e4cb9d0cfc32ba4d01cf4ce7833ecf9b22';
const verifierDigest='3fe6d28e9d03d86441267af8423ab23dad78a6b796b5b28b683a7fbc0bc7fc0f';
const approvedBlobs=new Map([
 ['package.json','0c4b3396fb237f205ded0d9ea36da82dc55bb19c'],
 ['package-lock.json','7b2379c008d8ed9823a045bed6b49712505b8472'],
 ['lib/imports/contracts.ts','65d3ba837fc3eb6a3127114176c804fc6a85cdb9'],
 ['tests/unit/imports/mapping-resource-bound.test.ts','0252cdea6e3de820b7241a7ebbdbd61291573e39'],
]);
const addedPath='tests/unit/imports/mapping-resource-bound.test.ts';
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
assert.equal(git('show','-s','--format=%P',parent),original,'Historical harness ancestry changed');
assert.equal(git('rev-list','--count',original+'..'+parent),'1','Historical harness must remain one child');
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
assert.deepEqual(untracked,precommit?[addedPath]:[],'Unexpected untracked files');

const tree=ref=>new Map(git('ls-tree','-r','-z',ref).split('\0').filter(Boolean).map(entry=>{
 const tab=entry.indexOf('\t');
 const [mode,type,blob]=entry.slice(0,tab).split(' ');
 assert.equal(type,'blob','Non-blob tree entry forbidden');
 return [entry.slice(tab+1),{mode,blob}];
}));
const parentFiles=tree(parent);
assert(!parentFiles.has(addedPath),'Focused test must be the sole addition');
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
actualBlob(addedPath,'100644');
changed.push(addedPath);
assert.deepEqual(changed.sort(),allowed,'Only the five exact authorized files may change');
for(const [path,blob] of approvedBlobs) assert.equal(actualBlob(path,'100644'),blob,'Unapproved successor content: '+path);
const source=readFileSync(verifierPath,'utf8');
const normalized=source.replace(/const verifierDigest='[0-9a-f]{64}';/,"const verifierDigest='NORMALIZED_DIGEST';");
assert.equal(createHash('sha256').update(normalized).digest('hex'),verifierDigest,'Unapproved verifier content');
if(!precommit) {
 const committed=tree('HEAD');
 assert.deepEqual([...committed.keys()].sort(),[...parentFiles.keys(),addedPath].sort(),'Committed file inventory changed');
 for(const [path,{mode,blob}] of committed) {
  assert.equal(mode,parentFiles.get(path)?.mode??'100644','Committed mode changed: '+path);
  assert.equal(actualBlob(path,mode),blob,'Committed bytes differ: '+path);
 }
 const delta=git('diff','--raw','--no-abbrev','--no-renames',parent,'HEAD').split('\n');
 assert.deepEqual(delta.map(line=>line.split('\t')[1]).sort(),allowed,'Committed delta changed');
 for(const line of delta) {
  const added=line.endsWith('\t'+addedPath);
  assert.match(line,added?/^:000000 100644 0{40} [0-9a-f]{40} A\t/:/^:100644 100644 [0-9a-f]{40} [0-9a-f]{40} M\t/,'Rename/deletion/mode change forbidden');
 }
}
assert.equal(JSON.parse(readFileSync('release/candidates.json','utf8')).candidates.length,0,'Registry must remain deny-all');

// Preserve ALL historical assertions without rewriting them for new dependencies.
// Execute the exact pinned verifier against the exact immutable harness parent in
// a disposable local clone. Only this temporary clone is written and then removed.
const historicalRoot=mkdtempSync(join(tmpdir(),'chasum-historical-isolation-'));
try {
 const checkout=join(historicalRoot,'parent');
 gitAt(root,'-c','init.templateDir=','clone','--quiet','--shared','--no-checkout',root,checkout);
 gitAt(checkout,'checkout','--quiet','--detach',parent);
 assert.equal(gitAt(checkout,'rev-parse','HEAD'),parent);
 assert.equal(gitAt(checkout,'hash-object',verifierPath),historicalVerifierBlob);
 execFileSync(process.execPath,[verifierPath],{cwd:checkout,env,stdio:'pipe'});
} finally {
 rmSync(historicalRoot,{recursive:true,force:true});
}
console.log(JSON.stringify({mode:precommit?'PRECOMMIT_ONLY':'COMMITTED_SECURITY_CHILD',head,parent,parentTree,original,historicalVerifierBlob,historicalVerification:'PASS',changedFiles:allowed,protectedSourceFiles:parentFiles.size-4,registry:'DENY_ALL'}));
