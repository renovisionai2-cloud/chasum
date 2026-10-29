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
const auditedCorrection = "bb1baf105232eb75e4cd7ee4f159cdb54237c360";
const auditedCorrectionTree = "a14a049acac5e90e33163182b72a06a815df59dc";
const footerTestPath = "tests/unit/dashboard/preview-build-badge-containment.test.tsx";
const diagnosticTestPath = "tests/unit/dashboard/m1c-reception-compatibility.test.tsx";
const qualityPath = ".github/workflows/quality.yml";
const verifierPath = "scripts/verify-reception-integration.mjs";
assert(process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === "--precommit"), "Only committed mode or --precommit is supported");
const precommit = process.argv[2] === "--precommit";
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
// This task permits four continuity documents plus this verifier, never source/tests.
const documentationPaths = [
  "docs/CURRENT_PROJECT_STATE.md",
  "docs/handoffs/LATEST_HANDOFF.md",
  "docs/CHANGELOG.md",
  "docs/product/14_DECISION_LOG.md",
  verifierPath,
];
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

// Freeze the accepted browser correction before admitting one documentation child.
assert.equal(git("rev-parse", `${auditedCorrection}^{tree}`), auditedCorrectionTree, "Audited browser-correction tree changed");
assert.equal(git("show", "-s", "--format=%P", auditedCorrection), auditedDiagnostics, "Audited browser-correction parent changed");
assert.deepEqual(
  git("diff", "--no-renames", "--name-status", auditedDiagnostics, auditedCorrection).split("\n").filter(Boolean).sort(),
  correctionPaths.map((path) => `M\t${path}`).sort(),
  "Historical browser correction must retain exactly its three approved existing files",
);

if (precommit) {
  assert.equal(head, auditedCorrection, "Precommit documentation must start at the exact audited browser correction");
  assert.equal(git("diff", "--name-only", "--diff-filter=U"), "", "Merge conflicts remain unresolved");
  assert.equal(git("diff", "--name-only"), "", "Precommit verifier requires no unstaged changes");
  assert.equal(git("ls-files", "--others", "--exclude-standard"), "", "Unexpected untracked files");
} else {
  assert.equal(
    git("show", "-s", "--format=%P", "HEAD"),
    auditedCorrection,
    "Documentation child must have the exact audited browser correction as its direct and only parent",
  );
  assert.equal(git("rev-list", "--count", `${auditedCorrection}..HEAD`), "1", "Exactly one documentation child is allowed");
  assert.equal(git("status", "--porcelain", "--untracked-files=all"), "", "Integration worktree must be clean");
}
for (const ancestor of [candidate, main, auditedMerge, auditedHardening, auditedDiagnostics, auditedCorrection]) {
  git("merge-base", "--is-ancestor", ancestor, "HEAD");
}
const documentationDiff = precommit
  ? git("diff", "--cached", "--no-renames", "--name-status", auditedCorrection)
  : git("diff", "--no-renames", "--name-status", auditedCorrection, "HEAD");
assert.deepEqual(
  documentationDiff.split("\n").filter(Boolean).sort(),
  documentationPaths.map((path) => `M\t${path}`).sort(),
  "Documentation child must modify exactly the five approved existing files",
);
const metadataDiff = precommit
  ? git("diff", "--cached", "--no-renames", "--summary", auditedCorrection)
  : git("diff", "--no-renames", "--summary", auditedCorrection, "HEAD");
assert.equal(metadataDiff, "", "Documentation child must not add/delete/rename paths or change file modes");

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
  assert.equal(blobAt(auditedHardening, path), blob, `Historical reconciled blob changed: ${path}`);
}

// Historical continuity remains pinned above; only these exact reviewed new blobs pass.
const documentationBlobs = new Map([
  ["docs/CURRENT_PROJECT_STATE.md", "c6b0f3b9811c6663e873638cb68d7603a034f175"],
  ["docs/handoffs/LATEST_HANDOFF.md", "82502f503db1c06c2c93a2e023152f57ead8ec46"],
  ["docs/CHANGELOG.md", "0359a58bed23536757dadfe7827bbea1154b48da"],
  ["docs/product/14_DECISION_LOG.md", "094a8eef3e8f117b14566ccc74ef24b28a0c3a94"],
]);
for (const [path, blob] of documentationBlobs) {
  assert.equal(finalBlob(path), blob, `Unapproved documentation content: ${path}`);
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
const correctionFileSet = pathSet(auditedCorrection);
assert.deepEqual([...finalPaths].sort(), [...correctionFileSet].sort(), "Documentation child must not add or remove paths");
for (const path of finalPaths) {
  if (!inheritedPaths.has(path)) assert.equal(path, verifierPath, `Unexpected integration-only path: ${path}`);
  if (!documentationPaths.includes(path)) {
    assert.equal(finalBlob(path), blobAt(auditedCorrection, path), `Unexpected documentation-child change: ${path}`);
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
  parents: [auditedCorrection],
  auditedCorrection,
  auditedCorrectionTree,
  documentationPaths,
  documentationBlobs: Object.fromEntries(documentationBlobs),
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
