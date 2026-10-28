# Issue #136 — Release Control Closeout

**Date:** 2026-10-02
**Classification:** LAUNCH REQUIRED release-governance / Production-safety control
**Competitive Product Gate:** NOT_APPLICABLE — documentation-only release-governance and security closeout; no customer or operator feature change.

## Purpose

Issue #136 exists because PR #131 was approved for **merge only / no Production deployment**, yet the pre-#136 Vercel Git integration automatically created a Production-target deployment after merge.

PR #131 squash merge:
`664fbc734c4103d78484c6b3828849a6605a562f`

Defect deployment object:
`6788186484`

That object is the historical defect record, **not a Production release**. It was stopped before canonical traffic moved. PR #131 remains separately gated for any future Production release.

## Structural fix

The real project now has two independent automatic-deploy barriers:

1. Repository control in `vercel.json`:
   `"git": {"deploymentEnabled": {"main": false}}`
2. Vercel Production Deployment Sources restricted to **CLI only**.

The validator requires `deploymentEnabled` to contain exactly the `main` key and rejects sibling-glob bypasses such as `{"main": false, "main*": true}`.
Post-fix merges #138, #139 and #140 created zero GitHub deployment objects. Merge `c2bd57840001d2abf9b6af1d4a64ef3e881ce05d` has no deployment object of any kind.

Canonical Production remained:
`b2ee664a2e2125473450254f79af39563cf18471`

Canonical Production deployment remained:
`dpl_2yFCVso4Twa5AUvm5PB6Kmvvv85u`

## Governed release path

Production can move only through `.github/workflows/release-production.yml` after all release controls pass.

The release path requires:

- an exact 40-hex SHA;
- an allowlisted, non-expired, non-revoked candidate from `release/candidates.json`;
- fetched-main validation and trusted exact checkout/archive;
- required tests/build;
- the protected `production-release` GitHub Environment;
- Product Owner environment approval;
- a finite project-scoped Vercel credential available only inside the gated release step;
- a fresh Production deployment tied to the exact candidate;
- exact current-run deployment identity validation;
- promotion handling when rollback state prevents canonical movement;
- canonical alias + `/api/build-info` verification;
- restoration of the prior deployment if a release fails after Production state begins changing.

`release/candidates.json` remains deny-all by default.
The release workflow has **never executed on the real Chasum project**. Its first real execution remains a separate Product Owner decision and must not be inferred from this closeout.

## GitHub governance

Ruleset `23730556` remains active with source-pinned required checks:

- Vercel → integration `8329`
- competitive-product-gate → integration `15368`
- quality → integration `15368`

Strict/up-to-date checks, review-thread resolution, deletion protection and non-fast-forward protection remain active.

The dedicated **Chasum Engineering Author** GitHub App (App ID `5157584`, installation `167070582`) is repository-scoped to `renovisionai2-cloud/chasum` and has only metadata read, contents write and pull-request write permissions. It has no Actions, Administration, Checks, Statuses, Deployments, Environments, Secrets or Workflows authority.

The `production-release` Environment (ID `23300787366`) requires the Product Owner reviewer, has `can_admins_bypass=false`, and is limited to protected branches.

## B-1 Product Owner waiver

CODEOWNERS enforcement is **deliberately deferred / WAIVED**, not passed.

Current review state:

- `required_approving_review_count = 0`
- `require_code_owner_review = false`
- `require_last_push_approval = false`
- `dismiss_stale_reviews_on_push = false`

The existing `.github/CODEOWNERS` file is therefore present but not currently enforcing review.
Reason: Chasum currently has one human collaborator / Product Owner. Requiring one approving review and CODEOWNER review now would make Product-Owner-authored control-plane PRs depend on routine administrative bypass. Routine bypass would weaken governance.

Compensating controls remain the source-pinned required checks, Quality protection for Option A, server-side CLI-only Option F, low-privilege Engineering Author App, the protected `production-release` Environment, exact-SHA release workflow, deny-all candidate policy and canonical Production verification.

**Revisit trigger:** when a second trusted human collaborator is added, re-evaluate enabling together:

- `required_approving_review_count=1`
- `require_code_owner_review=true`
- `require_last_push_approval=true`
- `dismiss_stale_reviews_on_push=true`
- `prevent_self_review=true` where operationally appropriate.

## Credential lifecycle

Governed release credential:

- name: `Chasum Governed Production Release 2026-10-02`
- token id: `WxJ8xZKuPraKYfj58ap5mT37wcv2tkvuC0ZdrD0aeZG4bHFr`
- scope: `project-only`
- project: `prj_nUq0i5faNZTNYfQHSsLukYTW8ugm`
- expiry: approximately 2026-11-01
- storage: `production-release` Environment secret `VERCEL_TOKEN`

The token value was never stored in repository documentation or pasted into ChatGPT.
Before installation, the project-scoped credential passed read-only access checks for:

1. `GET /v4/aliases/chasum.vercel.app`
2. `GET /v13/deployments/dpl_2yFCVso4Twa5AUvm5PB6Kmvvv85u`
3. `GET /v9/projects/prj_nUq0i5faNZTNYfQHSsLukYTW8ugm`

The direct dashboard project-token path superseded the earlier proposed temporary Full Account minting credential; no Full Account minting token was created.

Credential cleanup completed:

- four non-expiring personal Vercel tokens revoked;
- discharged fixture-purpose token revoked;
- zero non-expiring personal tokens remain;
- Vercel-managed Git credential `cred_af7117d19d5654c3f9236e0115968a8f65c82518` retained because Preview depends on it;
- five recently active unidentified OTP sessions deliberately excluded from revocation;
- stale finite-lived sessions may expire naturally.

## Serving identity

Canonical Production identity is independently checked through `/api/build-info`.

Under the CLI release model, `VERCEL_GIT_COMMIT_SHA` is supplied by the governed release run from the same validated `$RELEASE_SHA` used to archive the deployed tree. This is sufficient for release-state verification but is **not** a cryptographic Vercel attestation of artifact contents.

All tenants remain on the same Chasum Vercel project and one shared application release artifact; there is no tenant-specific deployment mechanism.
## Residuals carried forward

These are not #136 closure blockers, but must remain visible:

1. The governed real Production release workflow has now run successfully on Chasum: run `37128562995` released exact approved #131 SHA `664fbc734c4103d78484c6b3828849a6605a562f` to canonical deployment `dpl_9Rfvssq3k8WHV6D6TFpkUtJDGuGF`.
2. Project-scoped token deploy capability and canonical verification are now exercised on real Chasum. Rollback/restoration was not invoked in the successful run; rollback remains available but not yet exercised in a real-project failure.
3. Release credential rotation is due approximately **2026-11-01**.
4. A Vercel project-scoped token can still change project settings, including the CLI-only deployment policy; this is a Vercel platform limitation and requires periodic policy read-back/detection.
5. If deploy succeeds but promotion fails, a staged Production artifact may remain while canonical traffic stays on the prior deployment.
6. `prevent_self_review=false` on `production-release`; with one collaborator this is a deliberate human confirmation/audit gate, not two-person separation of duties.
7. Five recent OTP sessions remain unidentified but finite-lived; target steady state is zero unowned active credentials by identification or expiry.
8. Historical Production deployment object `6788186484` for PR #131 is the original stopped defect record and must never be misread as the governed #131 Production release. The accepted governed release is run `37128562995` / deployment `dpl_9Rfvssq3k8WHV6D6TFpkUtJDGuGF`.

## Historical closeout merge gate — COMPLETED

The documentation-only #136 closeout merge passed this final real-project re-proof and Issue #136 was closed. The original criteria are retained below as historical acceptance evidence.

After its merge, close Issue #136 only if all four observations hold:

1. zero GitHub deployment objects for the documentation merge SHA;
2. canonical `/api/build-info` still serves `b2ee664a2e2125473450254f79af39563cf18471`;
3. `release-production` workflow runs remain zero;
4. `release/candidates.json` remains deny-all.

If any observation fails, do not close Issue #136.

## Separation from #131 — later separately exercised

Issue #136 closeout itself did **not** authorize PR #131 for Production. That separation was preserved.

On 2026-10-03, the Product Owner later issued a separate fresh candidate authorization and separate protected-Environment Production approval for exact #131 SHA `664fbc734c4103d78484c6b3828849a6605a562f`. Governed run `37128562995` then succeeded and canonical Production moved to deployment `dpl_9Rfvssq3k8WHV6D6TFpkUtJDGuGF`, with exact build-info and health verification. This is the first real-project exercise proving the control model beyond merge suppression. The used candidate was subsequently cleared back to deny-all.

The historical automatic deployment object `6788186484` remains only the stopped pre-#136 defect record and must never be conflated with the governed release.
