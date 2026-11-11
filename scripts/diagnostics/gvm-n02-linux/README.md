# One-run Linux diagnostic

Authorized diagnostic source: `f72af50366224ac2630053e16d4b0cac443ff253`, tree
`cffaea928abe6c58626a631ea92333857b7cf4b6`. Diagnostic branch:
`codex/gvm-n02-linux-diagnostic-20261111`. Do not merge this branch.

The workflow runs only for creation of that exact branch, attempt 1. No manual,
PR, schedule or generic branch trigger exists. One non-force push and one run
are authorized. No retry or corrective publication is authorized.

Two separate checkouts keep diagnostic tools outside the immutable application.
The source SHA/tree and four-file diagnostic delta are verified before execution.
Ubuntu 24.04 and Node 22.23.4 use npm ci and the lockfile's Playwright browsers.
No Environment, service, hosted credentials, database or customer data is used.

The unchanged Reception suite (64 cases plus 23 teardown regressions) runs once,
then unchanged N02 (17 editor, four writer, 16 browser cases) runs once.
Each suite's actual exit code is propagated. The clipboard probe is a separate
observation, not a retry of a failed suite. A failed step remains failed while
independent observations complete within the same authorized run.

The external suite collector enables existing diagnostics and samples process
metadata. It does not inject code, monkey-patch Playwright, alter assertions,
change fixture deadlines or kill browser processes. Outstanding-operation counts
are inferred from API log names, not internal protocol IDs. Process absence is
not equivalent to a recorded successful exit. Logging/sampling can affect timing;
a diagnostic pass does not erase prior failures.

The clipboard probe bundles the unchanged real component fixture. It records
native readonly/editable source copy/paste into React and a separate plain input.
Only the diagnostic DOM source's readOnly flag and added plain control differ.
No synthetic paste event is used. Native paste still must reach 1234 cents.
Clipboard API reads occur after native observations, have a bounded observation
window, and do not grant permissions or write clipboard data. Unsupported or
rejected API reads are recorded, not treated as clipboard proof.
The plain-control probe is observed without replacing the real-component oracle.

Reception's concurrent browser closes retain 30s each; Vite 10s; afterAll 45s.
Outer workflow step/job limits only bound the disposable runner and cannot turn
a failed/unconfirmed close into success. Partial evidence uploads on failure.

Source tests/application/dependencies/workflows remain unchanged. Only this
workflow and its three diagnostic companion files are published. Any justified
N02 correction is LOCAL ONLY and separately reviewed; Reception/application
changes require separate approval. Stop after a failed or inconclusive run.

Competitive Product Gate: NOT_APPLICABLE — diagnostic-only investigation of
locked behavior. Financial overpayment/int4 risks and Production HELD remain.
