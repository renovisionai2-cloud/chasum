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
const appAllowed=[...exactDesign,...exactIntegration,'components/day-view/morning-brief.tsx','components/booking-sheet/booking-sheet.tsx'];
const testAllowed=['tests/unit/booking/booking-sheet-payment-submit.test.tsx','tests/unit/booking/m1b-scope-transport.test.tsx','tests/unit/calendar/operational-calendar.test.tsx',
 'tests/unit/calendar/calendar-date-retention.test.tsx','tests/unit/calendar/cal01-fixtures.ts','tests/unit/calendar/calendar-booking-selection.test.tsx',
 'tests/unit/calendar/reception-origin.test.ts','tests/unit/calendar/appointment-card-indicators.test.tsx',
 'tests/unit/calendar/reception-production-compatibility.test.tsx','tests/unit/ui/sheet-focus-stability.test.tsx',
 ...['entry.tsx','index.html','run.mjs','dense.mjs','submit.mjs','date-retention.mjs'].map(p=>'tests/unit/calendar/isolated-browser/'+p)];
const docs=['docs/CURRENT_PROJECT_STATE.md','docs/handoffs/LATEST_HANDOFF.md','docs/product/14_DECISION_LOG.md'];
const allowed=new Set([...appAllowed,...controls,...testAllowed,...docs,'scripts/verify-reception-isolation.mjs']);
const paths=[...new Set([...git('diff','--name-only',production).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')])].filter(Boolean);
for(const path of paths) assert(allowed.has(path)||path.startsWith('docs/validation/reception-production-isolated/'),`Outside approved scope: ${path}`);
const protectedPaths=['lib','supabase','providers','app/api','app/auth','middleware.ts','proxy.ts','package.json','package-lock.json','app/globals.css','app/layout.tsx'];
assert.equal(git('diff',production,'--',...protectedPaths),'','Production behavior boundary changed');
const brief=readFileSync('components/day-view/morning-brief.tsx','utf8');
assert(!/financial-aggregate|financialAmountText|brief\.(todayRevenue|outstandingPayments|chase)/.test(brief));
assert.equal(JSON.parse(readFileSync('release/candidates.json','utf8')).candidates.length,0,'Release policy must remain deny-all');
console.log(JSON.stringify({production,approved,main,exactDesignFiles:exactDesign.length-1,dateRetentionBlob,exactIntegrationFiles:exactIntegration.length,exactCurrentControlFiles:controls.length,protectedPathsUnchanged:protectedPaths,changedFiles:paths.sort()},null,2));
