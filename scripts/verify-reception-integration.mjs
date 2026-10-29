// Local-only integration reconciliation. Never fetches, publishes, queries data, or deploys.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const candidate = "9f305c2f9a377b95aa1642a3dc69f70cc0cb4573";
const main = "80968d24dc1d87407205e54ccc949433ed39e8eb";
const auditedMerge = "2942ac9edd29600bf05d7208526778b0d995d7e6";
const auditedMergeTree = "3488bddb4a30c1eb43ef16c640b370e426b6ee34";
const auditedHardening = "bd0e9fc73528373f304dbc9fb8c259bd9b7daa93";
const auditedHardeningTree = "095577e81096ef0ecedccb5f3d9ac7f73c5ec8cd";
const auditedDiagnostics = "127b8fc9d842829da14e98390d988da56be9bdd6";
const auditedDiagnosticsTree = "06793a44140f2361320de813599cfd0da24bc60a";
const footerTestPath = "tests/unit/dashboard/preview-build-badge-containment.test.tsx";
const diagnosticTestPath = "tests/unit/dashboard/m1c-reception-compatibility.test.tsx";
const qualityPath = ".github/workflows/quality.yml";
const verifierPath = "scripts/verify-reception-integration.mjs";
const precommit = process.argv.includes("--precommit");
const git = (...args) =>
  execFileSync("git", ["--no-replace-objects", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
const blobAt = (ref, path) => {
  try {
    return git("rev-parse", `${ref}:${path}`);
  } catch {
    return null;
  }
};
const indexBlob = (path) => {
  try {
    return git("rev-parse", `:${path}`);
  } catch {
    return null;
  }
};
const finalBlob = (path) => precommit ? indexBlob(path) : blobAt("HEAD", path);

const hardeningPaths = [qualityPath, verifierPath];
const diagnosticPaths = [diagnosticTestPath, verifierPath];
const correctionPaths = [diagnosticTestPath, footerTestPath, verifierPath];
const head = git("rev-parse", "HEAD");
assert.equal(git("rev-parse", `${auditedMerge}^{tree}`), auditedMergeTree, "Audited merge tree changed");
assert.equal(
  git("show", "-s", "--format=%P", auditedMerge),
  `${candidate} ${main}`,
  "Audited integration must retain candidate first and main second",
);

// The accepted hardening commit remains immutable; validate its original delta.
assert.equal(git("rev-parse", `${auditedHardening}^{tree}`), auditedHardeningTree, "Audited hardening tree changed");
assert.equal(git("show", "-s", "--format=%P", auditedHardening), auditedMerge, "Audited hardening parent changed");
assert.deepEqual(
  git("diff", "--name-only", auditedMerge, auditedHardening).split("\n").filter(Boolean).sort(),
  [...hardeningPaths].sort(),
  "Historical hardening must retain exactly its two approved paths",
);

// Preserve the accepted diagnostic child independently of this correction.
assert.equal(git("rev-parse", `${auditedDiagnostics}^{tree}`), auditedDiagnosticsTree, "Audited diagnostics tree changed");
assert.equal(git("show", "-s", "--format=%P", auditedDiagnostics), auditedHardening, "Audited diagnostics parent changed");
assert.deepEqual(
  git("diff", "--no-renames", "--name-status", auditedHardening, auditedDiagnostics).split("\n").filter(Boolean).sort(),
  diagnosticPaths.map((path) => `M\t${path}`).sort(),
  "Historical diagnostics must retain exactly their two approved existing files",
);

if (precommit) {
  assert.equal(head, auditedDiagnostics, "Precommit correction must start at the exact audited diagnostics");
  assert.equal(git("diff", "--name-only", "--diff-filter=U"), "", "Merge conflicts remain unresolved");
  assert.equal(git("diff", "--name-only"), "", "Precommit verifier requires no unstaged changes");
  assert.equal(git("ls-files", "--others", "--exclude-standard"), "", "Unexpected untracked files");
} else {
  assert.equal(
    git("show", "-s", "--format=%P", "HEAD"),
    auditedDiagnostics,
    "Correction must have the exact audited diagnostics as its direct and only parent",
  );
  assert.equal(git("rev-list", "--count", `${auditedDiagnostics}..HEAD`), "1", "Exactly one correction child is allowed");
  assert.equal(git("status", "--porcelain"), "", "Integration worktree must be clean");
}
git("merge-base", "--is-ancestor", candidate, "HEAD");
git("merge-base", "--is-ancestor", main, "HEAD");
git("merge-base", "--is-ancestor", auditedHardening, "HEAD");
git("merge-base", "--is-ancestor", auditedDiagnostics, "HEAD");
const correctionDiff = precommit
  ? git("diff", "--cached", "--no-renames", "--name-status", auditedDiagnostics)
  : git("diff", "--no-renames", "--name-status", auditedDiagnostics, "HEAD");
assert.deepEqual(
  correctionDiff.split("\n").filter(Boolean).sort(),
  correctionPaths.map((path) => `M\t${path}`).sort(),
  "Correction must modify exactly the three approved existing files",
);

function assertBuildBeforeTest(workflow, testCommand, label) {
  const buildIndex = workflow.indexOf("run: npm run build");
  const testIndex = workflow.indexOf(testCommand);
  assert.notEqual(buildIndex, -1, `${label}: Build step is missing`);
  assert.notEqual(testIndex, -1, `${label}: Test step is missing`);
  assert(buildIndex < testIndex, `${label}: Build must occur before Test`);
}

const quality = readFileSync(qualityPath, "utf8");
assertBuildBeforeTest(quality, "run: npm run test", "Quality");
assert(quality.includes("name: Quality") && quality.includes("pull_request:"));
assert(quality.includes("npx playwright install --with-deps chromium webkit"));
assert(quality.includes("npm run test -- --maxWorkers=1"));
assert.match(quality, /^    timeout-minutes: 30$/m, "Quality timeout must remain exactly 30 minutes");

const release = readFileSync(".github/workflows/release-production.yml", "utf8");
assertBuildBeforeTest(release, "run: npm test", "Production release");
for (const invariant of [
  "workflow_dispatch:",
  "environment: production-release",
  'git --no-replace-objects -C control archive "$RELEASE_SHA"',
  "rollback_hold_deployment:",
  "verify-production-build-info.mjs",
  "npx playwright install --with-deps chromium webkit",
  "npm test -- --maxWorkers=1",
]) assert(release.includes(invariant), `Missing release invariant: ${invariant}`);

const manualPaths = new Set([
  "components/calendar/calendar-client.tsx",
  "components/day-view/morning-brief.tsx",
  "components/reception/reception-panel.tsx",
  "tests/unit/booking/booking-sheet-payment-submit.test.tsx",
  "tests/unit/calendar/calendar-booking-selection.test.tsx",
  "docs/CHANGELOG.md",
  "docs/handoffs/LATEST_HANDOFF.md",
  "docs/product/14_DECISION_LOG.md",
  "docs/CURRENT_PROJECT_STATE.md",
  "tests/unit/calendar/reception-production-compatibility.test.tsx",
  ".github/workflows/quality.yml",
  ".github/workflows/release-production.yml",
  verifierPath,
]);
assert.equal(manualPaths.size, 13, "Manual integration boundary must contain exactly 13 paths");

const candidateResolutions = [
  "components/calendar/calendar-client.tsx",
  "components/day-view/morning-brief.tsx",
  "components/reception/reception-panel.tsx",
  "tests/unit/booking/booking-sheet-payment-submit.test.tsx",
  "tests/unit/calendar/calendar-booking-selection.test.tsx",
];
for (const path of candidateResolutions) {
  assert.equal(finalBlob(path), blobAt(candidate, path), `Candidate resolution diverged: ${path}`);
}

const reconciledBlobs = new Map([
  [".github/workflows/quality.yml", "170f0fc43aca4720257942f3d202e5478d7aeabe"],
  [".github/workflows/release-production.yml", "b169e8421a89ef31c4c00cd347199cc7a5a0f6a6"],
  ["docs/CHANGELOG.md", "2a25ea098bf843a02bfd8ae2717823d7795dc62b"],
  ["docs/CURRENT_PROJECT_STATE.md", "665287fa9cf7a3e87ab4e2cbbc3cafc0aa3cec1c"],
  ["docs/handoffs/LATEST_HANDOFF.md", "ebb0b6936136c61dc02158e0479c6162c6188bb9"],
  ["docs/product/14_DECISION_LOG.md", "621a8e5fdc04a54468aec44e7a12fb481fd4fe17"],
  ["tests/unit/calendar/reception-production-compatibility.test.tsx", "1332c15b234c07b0137254590c1803a4f17eaca2"],
]);
for (const [path, blob] of reconciledBlobs) {
  assert(manualPaths.has(path), `Reconciled path is outside manual boundary: ${path}`);
  assert.equal(finalBlob(path), blob, `Unexpected reconciled blob: ${path}`);
}

const pathSet = (ref) => new Set(git("ls-tree", "-r", "--name-only", ref).split("\n").filter(Boolean));
const candidatePaths = pathSet(candidate);
const mainPaths = pathSet(main);
const finalPaths = precommit
  ? new Set(git("ls-files").split("\n").filter(Boolean))
  : pathSet("HEAD");
const inheritedPaths = new Set([...candidatePaths, ...mainPaths]);
for (const path of inheritedPaths) {
  assert(finalPaths.has(path), `Unexpected inherited-path deletion: ${path}`);
  // Preserve the historical 13-file reconciliation independently of this child.
  const resolvedBlob = blobAt(auditedHardening, path);
  const inherited = resolvedBlob === blobAt(candidate, path) || resolvedBlob === blobAt(main, path);
  if (!inherited) {
    assert.equal(reconciledBlobs.get(path), resolvedBlob, `Non-parent blob outside reviewed reconciliation: ${path}`);
  }
}
const diagnosticFileSet = pathSet(auditedDiagnostics);
assert.deepEqual([...finalPaths].sort(), [...diagnosticFileSet].sort(), "Correction child must not add or remove paths");
for (const path of finalPaths) {
  if (!inheritedPaths.has(path)) assert.equal(path, verifierPath, `Unexpected integration-only path: ${path}`);
  if (!correctionPaths.includes(path)) {
    assert.equal(finalBlob(path), blobAt(auditedDiagnostics, path), `Unexpected correction change: ${path}`);
  }
}

const protectedPaths = [
  "lib",
  "supabase",
  "providers",
  "app/api",
  "app/auth",
  "hooks",
  "middleware.ts",
  "proxy.ts",
  "package.json",
  "package-lock.json",
];
const protectedDiff = precommit
  ? git("diff", "--cached", main, "--", ...protectedPaths)
  : git("diff", main, "HEAD", "--", ...protectedPaths);
assert.equal(protectedDiff, "", "Protected main paths changed");

const candidateParityPaths = [
  "app/(dashboard)/dashboard/calendar/page.tsx",
  "components/booking-sheet/appointment-section.tsx",
  "components/booking-sheet/booking-sheet.tsx",
  "components/calendar/calendar-client.tsx",
  "components/calendar/calendar-toolbar.tsx",
  "components/calendar/calendar-views.tsx",
  "components/dashboard/sidebar.tsx",
  "components/day-view/appointment-card.module.css",
  "components/day-view/appointment-card.tsx",
  "components/day-view/day-control-center.tsx",
  "components/day-view/morning-brief.tsx",
  "components/reception/color-legend.tsx",
  "components/reception/reception-panel.tsx",
  "components/reception/reception-workspace.tsx",
  "components/system/preview-build-badge.tsx",
  "components/ui/sheet.tsx",
];
for (const path of candidateParityPaths) {
  assert.equal(finalBlob(path), blobAt(candidate, path), `Approved Reception parity changed: ${path}`);
}

const mainControlParityPaths = [
  ".github/CODEOWNERS",
  "AGENTS.md",
  "release/candidates.json",
  "scripts/assert-release-sha.mjs",
  "scripts/release-guard.mjs",
  "scripts/verify-production-build-info.mjs",
  "scripts/verify-release-control-config.mjs",
  "tests/release-control/assert-release-sha.test.mjs",
  "tests/release-control/verify-production-build-info.test.mjs",
  "vercel.json",
];
for (const path of mainControlParityPaths) {
  assert.equal(finalBlob(path), blobAt(main, path), `Release control diverged from main: ${path}`);
}

const policy = JSON.parse(readFileSync("release/candidates.json", "utf8"));
assert.equal(policy.version, 1);
assert.deepEqual(policy.candidates, [], "Release policy must remain deny-all");

console.log(JSON.stringify({
  mode: precommit ? "precommit" : "committed",
  head: precommit ? null : git("rev-parse", "HEAD"),
  tree: precommit ? git("write-tree") : git("rev-parse", "HEAD^{tree}"),
  parents: [auditedDiagnostics],
  auditedDiagnostics,
  auditedDiagnosticsTree,
  correctionPaths,
  auditedHardening,
  auditedHardeningTree,
  diagnosticPaths,
  auditedMerge,
  auditedMergeTree,
  mergeParents: [candidate, main],
  hardeningPaths,
  manualPaths: [...manualPaths],
  protectedPaths,
  candidateParityPaths,
  releasePolicy: "deny-all",
}, null, 2));
