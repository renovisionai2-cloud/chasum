# Issue #112 G-3 review transport

**REVIEW-ONLY / NOT EXECUTED / NO HOSTED CONTACT**

Source candidate: PR #116, branch `codex/p2b1-pub`.
- HEAD: `e730483fcf49f850e675dcac9bbe30151a23010e`
- Tree: `604b3900447a84501f92ed38be8debe4e7060ffa`
- Migration: `supabase/migrations/20260927043000_issue_112_p2b1_subscription_authority.sql`
- Migration SHA-256: `b25ecee239bafbc75a1d3ddac09e0512895ca3a017cffbd0f81750924ed26b20`

These three SQL files preserve the exact current bytes from the source worktree's
`test-results/issue-112/g3-staging-prep/` directory.

## Artifact SHA-256

- `r1-preapply-capture.sql`: `493f26f23aa286c88b8cd556f7ea84ea127f26367640637b26d181a2095dd04e`
- `r1-reverse-restore.sql`: `3da95aaced99efb1d6f2165e2c68cbd18483081ed091fbacf38a3797704f3468`
- `r2-hosted-staging-tests.sql`: `7d56c1ceb37a09b32f855355b3312e133f43794b0038015ddd6c706f7d153fb0`

## Review and execution gates

- `r1-reverse-restore.sql` (R-1b) is placeholder-bearing and MUST NOT execute.
  It is concretized only from real G-3a read-only capture output and then
  re-reviewed by Claude Development Control Tower before any mutating statement.
- R-2 incorporates Claude corrections C-1/C-2/C-3: no hosted migration
  re-application and explicit read-only post-apply shape verification; bounded,
  capture-backed fixture adaptation; and the primary late-write failure/replay
  proof with separately gated optional trigger fallback.
- No hosted migration re-application in G-3.
- This PR is REVIEW TRANSPORT ONLY / DO NOT MERGE. It must NEVER merge into
  `main` or `codex/p2b1-pub` unless separately authorized. Its sole purpose is
  to expose exact R-1/R-2 bytes to Control Tower review.
- No code/application/migration behavior change. Parent PR #116 remains unchanged.
- No Staging/Production contact or mutation; no SQL executed; no provider,
  Stripe, Checkout or webhook activation; no role privilege changes.
- G-3a/G-3b remain governed separately. G-3 execution remains held at S-0 until
  Claude reviews these bytes. If R-1a ACCEPT, clear G-3a only.
- Competitive Product Gate: NOT_APPLICABLE — documentation-only review transport,
  with no customer/operator feature or behavior change.
