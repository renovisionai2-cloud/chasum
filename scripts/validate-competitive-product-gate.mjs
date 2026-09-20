#!/usr/bin/env node

const body = (process.env.PR_BODY ?? "").replace(/\r/g, "");
const createdAt = Date.parse(process.env.PR_CREATED_AT ?? "");
const enforcementStartedAt = Date.parse("2026-09-20T00:23:04Z");

function fail(messages) {
  for (const message of messages) console.error(`competitive-product-gate: ${message}`);
  process.exit(1);
}

function escapeRegex(value) {
  return value.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function lineValue(label) {
  const escaped = escapeRegex(label);
  const match = body.match(new RegExp(`^${escaped}\\s*:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function isPlaceholder(value) {
  return !value || /CHOOSE_|replace-|#issue-or-link|todo|tbd/i.test(value);
}

const applicability = lineValue("COMPETITIVE GATE APPLICABILITY").toUpperCase();

if (!applicability) {
  if (Number.isFinite(createdAt) && createdAt < enforcementStartedAt) {
    console.log("competitive-product-gate: legacy PR grandfathered (created before enforcement).");
    process.exit(0);
  }
  fail(["missing COMPETITIVE GATE APPLICABILITY: REQUIRED or NOT_APPLICABLE"]);
}

if (!["REQUIRED", "NOT_APPLICABLE"].includes(applicability)) {
  fail(["COMPETITIVE GATE APPLICABILITY must be exactly REQUIRED or NOT_APPLICABLE"]);
}

if (applicability === "NOT_APPLICABLE") {
  const reason = lineValue("NOT APPLICABLE REASON");
  if (isPlaceholder(reason) || reason.length < 12) {
    fail(["NOT_APPLICABLE requires a concrete NOT APPLICABLE REASON"]);
  }
  console.log("competitive-product-gate: NOT_APPLICABLE with reason — pass.");
  process.exit(0);
}

const errors = [];
const source = lineValue("COMPETITIVE GATE SOURCE");
if (isPlaceholder(source)) {
  errors.push("REQUIRED gate needs a COMPETITIVE GATE SOURCE issue/link");
}

const requiredChecks = [
  "Relevant competitors reviewed",
  "Parity floor preserved",
  "Chasum advantage preserved",
  "Final UX does not create an obvious incumbent downgrade",
  "Acceptance evidence exists",
];

for (const label of requiredChecks) {
  const escaped = escapeRegex(label);
  if (!new RegExp(`^- \\[x\\] ${escaped}\\s*$`, "im").test(body)) {
    errors.push(`unchecked/missing: ${label}`);
  }
}

const userFacing = lineValue("USER-FACING WORKFLOW").toUpperCase();
if (!["YES", "NO"].includes(userFacing)) {
  errors.push("USER-FACING WORKFLOW must be exactly YES or NO");
}

if (userFacing === "YES") {
  const userChecks = [
    "Responsive behavior verified",
    "Accessibility/usability basics verified",
    "Momentic or equivalent workflow validation completed where applicable",
  ];
  for (const label of userChecks) {
    const escaped = escapeRegex(label);
    if (!new RegExp(`^- \\[x\\] ${escaped}\\s*$`, "im").test(body)) {
      errors.push(`user-facing acceptance unchecked/missing: ${label}`);
    }
  }
}

if (errors.length) fail(errors);

console.log("competitive-product-gate: REQUIRED gate mechanically complete — pass.");
