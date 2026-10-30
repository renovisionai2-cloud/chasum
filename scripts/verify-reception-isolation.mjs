// Local-only source reconciliation. Never fetches, publishes, queries data, or deploys.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const production='664fbc734c4103d78484c6b3828849a6605a562f';
const approved='7eca5899abc1d44d65205f144dc7e32307008f79';
const main='80968d24dc1d87407205e54ccc949433ed39e8eb';
const git=(...args)=>execFileSync('git',['--no-replace-objects',...args],{encoding:'utf8'}).trim();
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
const head=git('rev-parse','HEAD');
git('merge-base','--is-ancestor',audited,head);
if(head!==audited) {
 assert.equal(git('show','-s','--format=%P','HEAD'),audited,'M1C must be one direct child of the audited Reception');
 assert.equal(git('rev-list','--count',`${audited}..HEAD`),'1');
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
const m1cDelta=[...new Set([...git('diff','--name-only',audited).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')])].filter(Boolean);
for(const path of m1cDelta) {
 const evidence=/^docs\/validation\/reception-production-isolated\/m1c-account\/[a-zA-Z0-9_.-]+\.(png|log)$/.test(path);
 assert(m1cAllowed.has(path)||evidence,`Outside M1C boundary: ${path}`);
}
console.log(JSON.stringify({audited,head,accountBlob,m1cDelta,production,approved,main,exactDesignFiles:exactDesign.length-1,dateRetentionBlob,previewBadgeBlob,exactIntegrationFiles:exactIntegration.length,exactCurrentControlFiles:controls.length,protectedPathsUnchanged:protectedPaths,changedFiles:paths.sort()},null,2));
