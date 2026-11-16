# Decision B hosted-QA controls — unpublished draft

**G0 correction prepared for independent DELTA-ONLY review; unpublished.**
Linux isolation and the exact offline build have not been exercised.
This is a reviewable implementation, not an enabled workflow, hosted PASS,
Production approval, or a replacement candidate audit. Do not publish or dispatch
it under the local-preparation assignment. No candidate files or original evidence
are part of this patch.

## Binding and provenance

Candidate `29450dcadf5bcdcd2969392fc2e5b22e6c5bafd5`, sole parent
`ab4e41f530d2a2da65bda429407e0f84446f9fac`, tree
`66a24996a8c41ef157563eb1d6a6c7ed54fdb60e`. `contract.json` binds all
1,532 tracked files, 95 selected test files and 949 assertion names, including
duplicate parameterized names as a multiset. It lists every one of the 105
omitted test files with a reason. There are no allowed skips in the selected scope.

Action pins were resolved from the official repository tag-ref API endpoints
recorded in the contract: checkout v4.2.2, setup-node v4.4.0 and upload-artifact
v4.6.2. These are commit objects, not floating tags. The official Microsoft registry
manifest for Playwright v1.61.1-noble resolves Linux amd64 to the contract's OCI
digest. Ubuntu Noble is 24.04. That image contains Node 24; it is therefore
insufficient on its own. The workflow supplies Node **22.23.4** in a read-only
runtime mount, clears the environment, and asserts the exact running version.
The official Node release checksum manifest includes the Linux x64 tarball with
SHA-256 `1805bcd35e6815559bd2eb97db438d3fdb0eb3a5e6a977b7c1badca76337e9ce`.

## Isolation and acquisition

Only trusted orchestration runs on the runner. It checks out controls at the
workflow run's immutable `github.sha` and the full candidate SHA in a separate
directory. Both checkouts disable persisted credentials. Default-branch dispatch
and the exact candidate input are asserted before checkout.

The acquisition directory receives only the frozen package manifest and lockfile.
An empty npm configuration and clean home are used. Every package URL must be
the npm registry and carry SHA-512 integrity. `npm ci --ignore-scripts` populates
an isolated cache; no candidate lifecycle executes here. The first executable
installation occurs with `npm ci --offline` inside the restricted container.
The lock includes Linux native optional packages for Sentry CLI and unrs-resolver.
Sentry CLI, msw and unrs-resolver lifecycle work runs only offline; Darwin-only
fsevents entries are not Linux dependencies. No lifecycle is silently skipped in
the actual validation install. An uncached native download or incompatible binary
fails the run; do not grant it network access or retry blindly.

The browser image is pulled by digest before execution. No browser installation
command runs with candidate code and external network access. Installed
playwright-core must remain 1.61.1; browser revisions and actual launched browser
versions are recorded.

Candidate execution uses Docker `--network none`, no host network, private PID/IPC,
UID/GID 1000, all capabilities dropped, no-new-privileges, default seccomp,
read-only image and read-only controls/input/Node mounts. Only ephemeral work,
home/temp, shared memory and a dedicated output directory are writable. There is
no Docker socket, host home, SSH/AWS/npm credential mount, `.git`, `.env` file,
GitHub token, artifact token, OIDC permission, cloud credential or authenticated
browser session in the execution filesystem/environment. The candidate is copied
from a fresh git archive; `.next` and `node_modules` are not reused.

Kernel checks require only `lo`, no external route, zero capabilities and
NoNewPrivs. A host-side controlled HTTP/UDP receiver is positively tested, then
must observe zero isolated hits. The bounded probe uses MSW with bypass, direct
TCP/UDP, controlled DNS, an IPv6 documentation address, a spawned child and both
browsers. Loopback HTTP must work. Browser probes use no request interception.
The IPv6 attempt is an unroutable-address probe plus interface/route evidence,
not a claim of reaching a positive-control external IPv6 receiver.

`env -i` supplies only PATH, HOME, TMPDIR, LANG, CI, telemetry disablement,
Playwright browser path and the synthetic screenshot directory. Bash's own
PWD/SHLVL/_ are checked separately. npm may add its ordinary package/lifecycle
metadata to its children; it has no inherited host credentials to add. No actual
Supabase/payment/messaging settings are supplied.

## Genuine font staging, with a precise remaining proof requirement

`fonts-lock.json` captures the actual two Google CSS requests, exact user agent,
full CSS bodies/hashes and 13 genuine WOFF2 asset URLs/hashes (305,208 bytes).
The Inter request asks for weights 400/500/600/700/800; JetBrains Mono for
100..800. All CSS subsets are retained. Acquisition rejects redirects, non-HTTPS,
unapproved hosts/paths, oversized responses, unexpected font signatures and
hash drift. It does not execute the downloaded files.

The installed Next 16.4.3 JavaScript test loader and the upstream Turbopack loader
have different font-file handling. The Rust implementation reads
NEXT_FONT_GOOGLE_MOCKED_RESPONSES for CSS but still fetches binary font URLs through
its HTTP client. A filesystem path in CSS is therefore not sufficient proof.
This draft changes only the harness CSS asset URLs to a fixed loopback store;
it retains the genuine font bytes and all CSS declarations. The build environment
alone receives the CSS-hook path. No app/layout.tsx or installed Next source is
patched, no substitute font is used, and `npm run build` remains `next build`.

The store implements only GET for exact digest paths. It cannot proxy, redirect,
tunnel, serve arbitrary files or contact the internet. It starts only for Build
and is terminated before Vitest. Successful Build must emit every staged font's
exact byte hash into `.next/static/media` and show the asset requests. This guards
against a build that silently uses fallback/dummy bytes.

The CSS hook is an internal mechanism, not a documented stable API. Source
inspection and the Mac font-store proof do **not** establish that the installed
Turbopack binary successfully evaluates this harness module and builds the exact
candidate under Ubuntu/Node22. That is the outstanding bounded proof. If it fails,
retain the exact error and stop; no external egress fallback is authorized.

Official implementation references:
- https://raw.githubusercontent.com/vercel/next.js/v16.4.3/crates/next-core/src/next_font/google/mod.rs
- https://raw.githubusercontent.com/microsoft/playwright/v1.61.1/utils/docker/Dockerfile.noble
- https://docs.docker.com/engine/network/drivers/none/
- https://nodejs.org/dist/v22.23.4/SHASUMS256.txt

## Execution and acceptance

The first proposed workflow performs ONLY acquisition, offline install, bounded
isolation/browser probes, original Build/font validation, source checks and evidence
collection. It passes `--proof-only --controls-verification hosted` as fixed arguments;
there is no mode input or full-QA fallback. Typecheck and the 949-test Vitest scope
are not invoked. Missing mode, extra/missing stages, full-QA artifacts and contradictory
proof reports fail acceptance. The full-QA inventory below is retained for a later,
separately approved controls revision, not executed by this first workflow.
All application assertions and timeouts are unchanged. Bash pipefail preserves failures.
A host-side assessment rechecks proof stages and its report after the container stops.
For later full-QA acceptance only, the retained assessor rejects a missing
file/assertion, duplicate, rename, failure or skip. Expected teardown-unit tests are not a
substitute for the actual fixture's close-complete events. All 12 navigation
milestones, matching cases, 12 screenshots and real Chromium/WebKit/Vite cleanup
are mandatory. A forced container removal after failure is containment cleanup,
never passing browser-fixture cleanup.

An exact source check occurs before execution, inside the copied source before
and after commands, and against the untouched checkout on every exit. Output
symlinks, unexpected file types and oversized artifacts are rejected. Logs are
stored instead of being interpreted as Actions commands, sanitized, and uploaded
by a separate host action. Failures, stages, browser revisions/versions, source
identity, omissions, screenshots and actual events are retained. Results on a
cancelled runner remain incomplete, never PASS.

The 105 omissions are 102 unchanged unit/integration files outside the accepted
scope and 3 separate Playwright e2e files. The single opt-in PostgreSQL file contains
the previously reported 36 cases and remains disabled/unprovisioned. The separate
Playwright suite would add built-app marketing/login/health smoke and synthetic
Reception/dashboard layout checks. It is Chromium-oriented, not tax-editor
Chromium/WebKit evidence; it is neither invoked nor pointed at any Preview here.

Exact requirement-to-case mapping is delivered in the local proof/coverage.json.
The malformed numeric action cases explicitly vary tax_cents, with no booking,
payment or notification writes; unavailable service/tax pricing asserts no insert
or event. Do not generalize these into an assertion that every malformed
price_cents/deposit_cents variant has an explicit action test. This limit is for
independent review, not authorization to change the frozen candidate.

## Local bounded proof, separate from eventual hosted QA

The archived original evidence records 22 small Mac harness checks; those are
historical, not rerun for G0. New controls-only tests use synthetic fixtures and mocks.
The original driver prerequisite check rejected the
Linux prerequisite before downloads or candidate execution. No Docker, Podman,
Lima, Colima, OrbStack, Multipass or QEMU executor is installed/available; connected
devices list only the Mac. No software was installed to work around this.

Execution mode and controls-verification mode are independent and mandatory.
For hosted proof, CONTROL_SHA must be a full 40-hex commit; actual controls HEAD must
match and `git status --porcelain --untracked-files=all` must be empty. The actual
commit and verification method are recorded separately from candidate identity.
Missing/invalid CONTROL_SHA cannot fall back to a manifest. Manifest arguments are
rejected in hosted mode, and GITHUB_ACTIONS=true rejects local mode.

For explicitly local proof on an approved existing Ubuntu24.04 amd64/Docker/Node22
executor, use `--proof-only --controls-verification local` with the external reviewed
manifest and its exact SHA-256. Missing files, changed manifest bytes and mismatched
source hashes still fail. No manifest hash is embedded in the workflow it hashes.
This mode performs isolation and the single exact font Build, then stops
**before** typecheck/Vitest; it cannot be
mistaken for hosted QA. It does not require publishing controls or a workflow run.

    python3 -B scripts/qa-decision-b/driver.py \
      --candidate /absolute/path/to/exact-clean-candidate \
      --output /absolute/path/to/new-disposable-proof-output \
      --proof-only --controls-verification local \
      --controls-manifest /absolute/path/to/controls-manifest.json \
      --manifest-sha256 REVIEWED_MANIFEST_SHA256

Local harness selftests replay copies of accepted JSON/log/screenshots; they never
execute the candidate suite. Use Python -B to avoid adding bytecode files to the
reviewed controls. Selftests need only a temporary loopback font-store listener.

## Publication and approval gates

1. Darshan manually dispatches independent review of the G0 correction DELTA ONLY.
   Claude’s November 16 design review remains accepted within its recorded scope.
   G0 local preparation does not authorize a hosted proof.
2. Review only the corrected workflow invocation, hosted/local trust binding,
   proof-only guards/reporting and new controls-test evidence. The previously reviewed
   isolation/font design and application audit are not reopened. No dispatch occurs here.
3. Obtain explicit permission to publish only this workflow and its supporting
   controls. Publication can trigger automatic Quality, Competitive Product Gate
   and Vercel Preview activity; that side effect also needs explicit approval.
   The feature gate rationale is NOT_APPLICABLE: internal QA infrastructure for
   already-locked tax behavior, with no product/UX changes.
4. Create one protected workflow-only PR based on freshly verified main, preserve
   Issue #136 controls, and obtain required checks. Separate Product Owner approval
   is required to merge the independently reviewed controls onto the default branch.
5. Obtain separate approval for ONE proof-only manual run at the approved controls revision
   and exact candidate SHA. No changing ref, alternate candidate, release
   registration or main-ancestry exception is part of this workflow.

Production remains governed by exact main-ancestry source, release registration
and separate protected production-release Environment approval. Nothing here
authorizes Production, a Preview interaction, database work, tenant setting
changes, customer communication, payments/refunds or a release-policy exception.


Resource and cancellation limits from the review remain open: measure actual disk/RAM
capacity on the eventual authorized runner; do not assume its tier or reduce existing
tmpfs caps/deadlines. /work remains 6g, /tmp 1g, /home 128m, shared memory 1g, and the
job deadline remains 45 minutes. Python availability, offline native installation,
browser operation and the exact font build remain unproven there. The driver has no
new SIGTERM handler; cancellation/runner loss can prevent finally/cleanup/artifact
completion. Such a run is incomplete, never PASS. No claim of guaranteed cancellation
cleanup is made. A failed proof must retain its exact error without candidate edits,
font substitution, bundler changes or increased egress.

Registry statements are source-scoped: the unchanged frozen candidate registry does
not establish current main's registry contents. No current-main registry emptiness
claim is made. Neither registry nor main ancestry is changed by this local draft.
Full hosted QA and Production remain separate later approvals.

G0 local result: 26 controls tests PASS, zero failures/errors/skips. Synthetic shell
commands stood in for Node/npm/Python candidate operations; no real candidate build,
regression, Docker or hosted run occurred. YAML, syntax and patch checks accompany
the correction evidence. actionlint and shellcheck were unavailable and not installed.
