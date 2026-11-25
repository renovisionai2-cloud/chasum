import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { load } from "js-yaml";

// js-yaml is already present in the unchanged npm lockfile (ESLint dependency).
const readWorkflow = name => load(readFileSync(new URL(`../../.github/workflows/${name}.yml`, import.meta.url), "utf8"));
const quality = readWorkflow("quality");
const release = readWorkflow("release-production");
const permittedReleaseSteps = ["Install Chromium and WebKit", "Build exact candidate", "Test exact candidate"];
// Semantic fingerprint from accepted b39b2e7, excluding only the three reordered/edited steps.
const protectedReleaseDigest = "9cf7ec13ee58d51f6afc271594ef22db4c5c3e3678c378880021f164103bdd00";

function verifyBrowserGate(workflow, jobName, names, directory) {
  const job = workflow.jobs[jobName];
  assert.equal(job["runs-on"], "ubuntu-latest");
  assert.equal(job["continue-on-error"], undefined);
  const steps = job.steps;
  const node = steps.find(s => s.name === "Set up Node.js");
  assert.equal(node.with["node-version"], "22");
  const [install, build, testStep] = names.map(name => {
    const matches = steps.filter(s => s.name === name);
    assert.equal(matches.length, 1, `one mandatory ${name} step`);
    const step = matches[0];
    assert.equal(step.if, undefined, `unconditional ${name}`);
    assert.equal(step["continue-on-error"], undefined, `fatal ${name}`);
    assert.equal(step["working-directory"], directory);
    assert.equal(step.env, undefined, `no secret/browser override in ${name}`);
    return step;
  });
  assert.equal(install.run, "npx playwright install chromium webkit --with-deps");
  assert.equal(build.run, "npm run build");
  assert.equal(testStep.run, jobName === "quality" ? "npm run test" : "npm test");
  assert.ok(steps.indexOf(install) < steps.indexOf(testStep));
  assert.ok(steps.indexOf(build) < steps.indexOf(testStep), "CSS build precedes tests");
}
function verifyProtectedRelease(workflow) {
  const copy = structuredClone(workflow);
  copy.jobs.release.steps = copy.jobs.release.steps.filter(s => !permittedReleaseSteps.includes(s.name));
  assert.equal(createHash("sha256").update(JSON.stringify(copy)).digest("hex"), protectedReleaseDigest,
    "all remaining Issue #136 policy, checkout, source, secret, approval and rollback controls preserved");
}
const configs = [
  ["quality", quality, "quality", ["Install Chromium and WebKit", "Build", "Test"], undefined],
  ["release", release, "release", permittedReleaseSteps, "source"],
];
for (const [name, workflow, job, names, directory] of configs) {
  test(`${name}: both browser engines and Linux dependencies; build before mandatory tests`, () => {
    verifyBrowserGate(workflow, job, names, directory);
  });
  for (const defect of ["missing WebKit", "test before build", "soft failure", "conditional tests"]) {
    test(`${name}: rejects ${defect}`, () => {
      const copy = structuredClone(workflow);
      const steps = copy.jobs[job].steps;
      const install = steps.find(s => s.name === names[0]);
      const build = steps.find(s => s.name === names[1]);
      const testStep = steps.find(s => s.name === names[2]);
      if (defect === "missing WebKit") install.run = "npx playwright install chromium --with-deps";
      if (defect === "test before build") {
        steps.splice(steps.indexOf(testStep), 1);
        steps.splice(steps.indexOf(build), 0, testStep);
      }
      if (defect === "soft failure") testStep["continue-on-error"] = true;
      if (defect === "conditional tests") testStep.if = "false";
      assert.throws(() => verifyBrowserGate(copy, job, names, directory));
    });
  }
}
test("Issue #136 protected release semantics remain identical to b39b2e7", () => verifyProtectedRelease(release));
for (const defect of ["approval environment", "trusted checkout", "source SHA", "secret exposure", "rollback handler"]) {
  test(`Issue #136 preservation rejects changed ${defect}`, () => {
    const copy = structuredClone(release);
    const job = copy.jobs.release;
    if (defect === "approval environment") delete job.environment;
    if (defect === "trusted checkout") job.steps[0].with.ref = "main";
    if (defect === "source SHA") job.steps.find(s => s.name === "Verify exact source").run = "true";
    if (defect === "secret exposure") job.env.VERCEL_TOKEN = "${{ secrets.VERCEL_TOKEN }}";
    if (defect === "rollback handler") job.steps.at(-1).run = "true";
    assert.throws(() => verifyProtectedRelease(copy));
  });
}
