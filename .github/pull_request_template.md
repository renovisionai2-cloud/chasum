<!-- competitive-product-gate:v1 -->
## Scope

Describe the bounded change and link the governing issue.

## Competitive product gate

COMPETITIVE GATE APPLICABILITY: CHOOSE_REQUIRED_OR_NOT_APPLICABLE
COMPETITIVE GATE SOURCE: #issue-or-link
NOT APPLICABLE REASON: replace-if-not-applicable

If **REQUIRED**:

- [ ] Relevant competitors reviewed
- [ ] Parity floor preserved
- [ ] Chasum advantage preserved
- [ ] Final UX does not create an obvious incumbent downgrade
- [ ] Acceptance evidence exists

USER-FACING WORKFLOW: CHOOSE_YES_OR_NO

If **YES**:

- [ ] Responsive behavior verified
- [ ] Accessibility/usability basics verified
- [ ] Momentic or equivalent workflow validation completed where applicable

## Engineering acceptance

- [ ] Requested behavior works
- [ ] Unrelated behavior remains intact
- [ ] Tenant isolation / money-data truth remain intact where relevant
- [ ] Tests / typecheck / lint / build run as appropriate
- [ ] Known limitations and deferred gaps are documented
- [ ] Source-of-truth / changelog updated where required

## Production safety

State whether this PR changes Production, migrations, tenant data, Auth/RLS, billing, provider configuration, or other controlled runtime state.
