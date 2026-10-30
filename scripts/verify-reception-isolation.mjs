// Local-only source reconciliation. Never fetches, publishes, queries data, or deploys.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readlinkSync, existsSync, lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
const production='664fbc734c4103d78484c6b3828849a6605a562f';
const approved='7eca5899abc1d44d65205f144dc7e32307008f79';
const main='80968d24dc1d87407205e54ccc949433ed39e8eb';
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8'}).trim();
// October 30: one exact test-only child; historical M1C checks below remain pinned
// to the original accepted child. --check-worktree is a precommit check ONLY:
// it requires HEAD at the original and cannot certify committed/release readiness.
const original='9f305c2f9a377b95aa1642a3dc69f70cc0cb4573';
const originalTree='bf808a3b29c3e688239ab8315d76c5786f665f56';
const originalParent='d3b20b5445baa40c2aa6bb0fb0e375c1ee55bc00';
const verifierPath='scripts/verify-reception-isolation.mjs';
const verifierDigest='140f638729f6fe7c5d44c7e50c07b7600ce136aced3b52cc1aa3f8d846c8ea66';
const testBlobs=new Map([
 ['tests/unit/dashboard/m1c-reception-compatibility.test.tsx','233a151ea13fe974f9ac3cecccffd48c26448e8e'],
 ['tests/unit/dashboard/preview-build-badge-containment.test.tsx','6e4c4579868c4c97d596703a927a44a8bc39ed93'],
]);
const childPaths=[...testBlobs.keys(),verifierPath].sort();
const precommit=process.argv.length===3 && process.argv[2]==='--check-worktree';
assert(precommit || process.argv.length===2,'Unsupported verifier arguments');
assert.equal(git('rev-parse','--is-shallow-repository'),'false','Complete history required');
assert.equal(git('for-each-ref','refs/replace'),'','Replacement refs are forbidden');
assert(!existsSync(git('rev-parse','--git-path','info/grafts')),'Grafted history is forbidden');
for(const [ref,tree] of [
 [production,'a45bcb6356c70ec108721f539e68eb67e47c99cb'],
 [originalParent,'4019321cfc88c52f451ce773fd08a3e55206f7b9'],
 [original,originalTree],
]) assert.equal(git('rev-parse',`${ref}^{tree}`),tree,`Historical tree changed: ${ref}`);
assert.equal(git('show','-s','--format=%P',original),originalParent,'Original Reception parent changed');
assert.equal(git('rev-list','--count',`${originalParent}..${original}`),'1');
for(const [path,blob] of [
 ['tests/unit/dashboard/m1c-reception-compatibility.test.tsx','3ff8e9318c71eac39dabca5d0115ec2828d2f33c'],
 ['tests/unit/dashboard/preview-build-badge-containment.test.tsx','ff2fa4667365fc37becd3731265fa296715f63b4'],
 [verifierPath,'ed7545a387c363f649173e64f90038125e4d3d0a'],
]) assert.equal(git('rev-parse',`${original}:${path}`),blob,`Original source changed: ${path}`);
const candidateHead=git('rev-parse','HEAD');
if(precommit) {
 assert.equal(candidateHead,original,'Precommit check requires the original HEAD');
 assert.equal(git('diff','--cached','--name-only'),'','Precommit check requires an unchanged index');
} else {
 assert.equal(git('show','-s','--format=%P','HEAD'),original,'Harness must be one direct and only child of original Reception');
 assert.equal(git('rev-list','--count',`${original}..HEAD`),'1','Extra descendants forbidden');
 assert.equal(git('status','--porcelain=v1','--untracked-files=all'),'','Committed candidate must be clean');
}
assert.equal(git('ls-files','--others','--exclude-standard'),'','Untracked files forbidden');
const deltaArgs=precommit ? [original] : [original,'HEAD'];
const delta=git('diff','--raw','--no-abbrev','--no-renames',...deltaArgs).split('\n').filter(Boolean);
assert.deepEqual(delta.map(line=>line.split('\t')[1]).sort(),childPaths,'Only the three exact existing files may change');
for(const line of delta) {
 assert.match(line,/^:100644 100644 [0-9a-f]{40} [0-9a-f]{40} M\t/,'Additions/deletions/renames/mode changes forbidden');
}
for(const path of childPaths) {
 const stat=lstatSync(path);
 assert(stat.isFile() && !stat.isSymbolicLink() && !(stat.mode & 0o111),`Invalid file type/mode: ${path}`);
}
for(const [path,blob] of testBlobs) assert.equal(git('hash-object',path),blob,`Unapproved test content: ${path}`);
// Read every preserved blob directly, rather than trusting Git's index stat
// cache, assume-unchanged flags, or core.filemode when declaring source parity.
for(const entry of git('ls-tree','-r',original).split('\n')) {
 const [metadata,path]=entry.split('\t');
 if(childPaths.includes(path)) continue;
 const [mode,type,blob]=metadata.split(' '), stat=lstatSync(path);
 assert.equal(type,'blob',`Unexpected original tree entry: ${path}`);
 assert(mode==='120000' ? stat.isSymbolicLink() : stat.isFile() && !stat.isSymbolicLink(),`Preserved file type changed: ${path}`);
 if(mode!=='120000') assert.equal(Boolean(stat.mode & 0o111),mode==='100755',`Preserved file mode changed: ${path}`);
 const bytes=mode==='120000' ? Buffer.from(readlinkSync(path)) : readFileSync(path);
 const actual=createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
 assert.equal(actual,blob,`Preserved source blob changed: ${path}`);
}
// Normalize only this digest literal to avoid a self-referential hash. The exact
// verifier and full child identity still require independent manual audit.
const verifierSource=readFileSync(verifierPath,'utf8');
const normalizedVerifier=verifierSource.replace(/const verifierDigest='[0-9a-f]{64}';/,"const verifierDigest='NORMALIZED_DIGEST';");
assert.equal(createHash('sha256').update(normalizedVerifier).digest('hex'),verifierDigest,'Unapproved verifier content');
console.log(JSON.stringify({mode:precommit?'PRECOMMIT_ONLY':'COMMITTED_CHILD',candidateHead,original,originalTree,childPaths}));
const exactDesign=[
 'app/(dashboard)/dashboard/calendar/page.tsx','components/calendar/calendar-client.tsx',
 'components/calendar/calendar-toolbar.tsx','components/day-view/appointment-card.module.css',
 'components/day-view/appointment-card.tsx','components/day-view/day-control-center.tsx',
 'components/reception/color-legend.tsx','components/reception/reception-panel.tsx',
 'components/reception/reception-workspace.tsx',
];
const exactIntegration=['components/calendar/calendar-views.tsx','components/booking-sheet/appointment-section.tsx','components/ui/sheet.tsx'];
const controls=['.github/CODEOWNERS','.github/workflows/quality.yml','.github/workflows/release-production.yml',
 'AGENTS.md','release/candidates.json','scripts/assert-release-sha.mjs','scripts/release-guard.mjs',
 'scripts/verify-release-control-config.mjs','scripts/verify-production-build-info.mjs',
 'tests/release-control/assert-release-sha.test.mjs','tests/release-control/verify-production-build-info.test.mjs','vercel.json'];
// PO-authorized selected-date correction: keep the entire changed file pinned.
const dateRetentionPath='components/calendar/calendar-client.tsx';
const dateRetentionBlob='5e07c8f4551775d44c3ea2966d7bb4fab0b2c076';
for(const [ref,paths] of [[approved,[...exactDesign,...exactIntegration]],[main,controls]]) {
 for(const path of paths) assert.equal(git('hash-object',path),path===dateRetentionPath ? dateRetentionBlob : git('rev-parse',`${ref}:${path}`),`Unexpected divergence: ${path}`);
}
// PO-authorized normal-flow diagnostic footer: exact file pin, no path wildcard.
const previewBadgePath='components/system/preview-build-badge.tsx';
const previewBadgeBlob='13213b0bf8873c3fe87b2a9ea13e4884a1d78031';
assert.equal(git('hash-object',previewBadgePath),previewBadgeBlob,'Unexpected divergence: Preview build badge');
const accountPath='components/dashboard/sidebar.tsx';
const accountBlob='e5065841c9cc80b8ad27703e3802627d6b2dc185';
assert.equal(git('hash-object',accountPath),accountBlob,'Unexpected divergence: M1C Account/drawer');
const appAllowed=[accountPath,previewBadgePath,...exactDesign,...exactIntegration,'components/day-view/morning-brief.tsx','components/booking-sheet/booking-sheet.tsx'];
const testAllowed=['tests/unit/dashboard/mobile-account-control.test.tsx','tests/unit/dashboard/top-nav-containment.test.tsx','tests/unit/dashboard/m1c-reception-compatibility.test.tsx','tests/unit/system/preview-build-badge.test.tsx','tests/unit/dashboard/preview-build-badge-containment.test.tsx','tests/unit/booking/booking-sheet-payment-submit.test.tsx','tests/unit/booking/m1b-scope-transport.test.tsx','tests/unit/calendar/operational-calendar.test.tsx',
 'tests/unit/calendar/calendar-date-retention.test.tsx','tests/unit/calendar/cal01-fixtures.ts','tests/unit/calendar/calendar-booking-selection.test.tsx',
 'tests/unit/calendar/reception-origin.test.ts','tests/unit/calendar/appointment-card-indicators.test.tsx',
 'tests/unit/calendar/reception-production-compatibility.test.tsx','tests/unit/ui/sheet-focus-stability.test.tsx',
 ...['entry.tsx','index.html','run.mjs','dense.mjs','submit.mjs','date-retention.mjs'].map(p=>'tests/unit/calendar/isolated-browser/'+p)];
const docs=['docs/CHANGELOG.md','docs/CURRENT_PROJECT_STATE.md','docs/handoffs/LATEST_HANDOFF.md','docs/product/14_DECISION_LOG.md'];
const allowed=new Set([...appAllowed,...controls,...testAllowed,...docs,'scripts/verify-reception-isolation.mjs']);
const paths=[...new Set([...git('diff','--name-only',production).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')])].filter(Boolean);
for(const path of paths) assert(allowed.has(path)||path.startsWith('docs/validation/reception-production-isolated/'),`Outside approved scope: ${path}`);
const protectedPaths=['lib','supabase','providers','hooks','app/api','app/auth','middleware.ts','proxy.ts','package.json','package-lock.json','app/globals.css','app/layout.tsx'];
assert.equal(git('diff',production,'--',...protectedPaths),'','Production behavior boundary changed');
const brief=readFileSync('components/day-view/morning-brief.tsx','utf8');
assert(!/financial-aggregate|financialAmountText|brief\.(todayRevenue|outstandingPayments|chase)/.test(brief));
assert.equal(JSON.parse(readFileSync('release/candidates.json','utf8')).candidates.length,0,'Release policy must remain deny-all');
// The M1C delta is narrower than the historical Reception composition allowlist.
const audited='d3b20b5445baa40c2aa6bb0fb0e375c1ee55bc00';
const head=original; // Preserve the original M1C historical ancestry contract.
git('merge-base','--is-ancestor',audited,head);
if(head!==audited) {
 assert.equal(git('show','-s','--format=%P',head),audited,'M1C must be one direct child of the audited Reception');
 assert.equal(git('rev-list','--count',`${audited}..${head}`),'1');
}
for(const path of ['components/booking-sheet/booking-sheet.tsx','components/ui/sheet.tsx','components/day-view/morning-brief.tsx']) {
 assert.equal(git('hash-object',path),git('rev-parse',`${audited}:${path}`),`Audited behavior changed: ${path}`);
}
const m1cAllowed=new Set([
 accountPath,
 'tests/unit/dashboard/mobile-account-control.test.tsx',
 'tests/unit/dashboard/top-nav-containment.test.tsx',
 'tests/unit/dashboard/m1c-reception-compatibility.test.tsx',
 'scripts/verify-reception-isolation.mjs',
 'docs/CURRENT_PROJECT_STATE.md','docs/handoffs/LATEST_HANDOFF.md','docs/CHANGELOG.md',
 'docs/validation/reception-production-isolated/m1c-account/README.md',
 'docs/validation/reception-production-isolated/m1c-account/results.json',
 'docs/validation/reception-production-isolated/m1c-account/browser-results.json',
 'docs/validation/reception-production-isolated/m1c-account/check-exits.json',
]);
const m1cDelta=git('diff','--name-only',audited,original).split('\n').filter(Boolean);
for(const path of m1cDelta) {
 const evidence=/^docs\/validation\/reception-production-isolated\/m1c-account\/[a-zA-Z0-9_.-]+\.(png|log)$/.test(path);
 assert(m1cAllowed.has(path)||evidence,`Outside M1C boundary: ${path}`);
}
console.log(JSON.stringify({audited,head,accountBlob,m1cDelta,production,approved,main,exactDesignFiles:exactDesign.length-1,dateRetentionBlob,previewBadgeBlob,exactIntegrationFiles:exactIntegration.length,exactCurrentControlFiles:controls.length,protectedPathsUnchanged:protectedPaths,changedFiles:paths.sort()},null,2));
