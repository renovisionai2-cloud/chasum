# Status — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → System Status (`/status`) |
| **VERSION** | Status V1 current-generation PO lock · 2026-08-30 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-30 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — STATUS READY FOR PO LOCK |
| **PO visual evidence** | STATUS PO VISUAL REVIEW — PASS |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `c855324caa0a973326018ab703254d4f8305fc0e` |
| **Security lock documentation parent** | `bd61abd6f46e8db2621dcd7ed9a861849f558546` |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## STATUS — PO LOCKED

Date: 2026-08-30  
Approved SHA: `c855324caa0a973326018ab703254d4f8305fc0e`  
Claude: **APPROVED — STATUS READY FOR PO LOCK**  
PO: **APPROVED**  
Visual: **STATUS PO VISUAL REVIEW — PASS**

Status:

- Marketing branch only.
- Not merged to `main`.
- Not deployed to Production.

This file is the **only** canonical current Status lock.

Resources umbrella: [`RESOURCES_V1_LOCK.md`](./RESOURCES_V1_LOCK.md) indexes `/status` to this file. It is not a second current Status lock.

---

## Historical July 2026 Status / Resources lock — SUPERSEDED

The previous Status state lived in the Resources **v1** lock (2026-07-30). It predates the high-trust operational-truth review.

| Field | Historical value (do not restore as current truth) |
|-------|--------|
| **Approved** | 2026-07-30 |
| **Preview visual SoT** | https://chasum-2qwiq9hxp-renovisionappcom.vercel.app/status |
| **Public stamp** | Last updated: 2026-07-30 |
| **Public booking** | Operational |
| **Known Issues** | No active platform-wide issues are listed at this time. |
| **Operational legend** | Working as expected for design partners. |
| **Email / payments row names** | Email delivery / Payment integrations |

That generation locked visual structure **and** operational claims that later failed product-truth review, including:

- Public booking marked Operational while the named/specific-staff Production confirmation path remained broken
- empty Known Issues while that Production-path defect was known
- “Last updated: 2026-07-30” presented as current
- Operational defined as “Working as expected for design partners”
- Email / payment rows that did not distinguish tenant vs platform scope
- nested Link/Button Status CTA

Do **not** restore July 2026 Status copy, the July Preview URL as current operational-truth, or “Public booking — Operational” while the known Production confirmation defect remains unresolved.

Hero headline, centered layout, six-row Current Services structure, legend categories, Planned Maintenance card, Known Issues card, and Support section remain the approved **layout** lineage. Current **operational** truth is SHA `c855324caa0a973326018ab703254d4f8305fc0e` only.

---

## Approval evidence (2026-08-30)

- Initial PO rendered visual review (visual foundation PASS)
- Cursor high-trust Status truth preflight
- Claude independent Level 3 pre-implementation challenge
- ChatGPT reconciliation
- Bounded Status truth-correction implementation
- Fresh PO rendered review of the corrected Preview
- Independent Claude final pre-lock audit
- Claude verdict: **APPROVED — STATUS READY FOR PO LOCK**
- PO visual: **STATUS PO VISUAL REVIEW — PASS**
- PO: **APPROVED**

Claude independently confirmed SHA `c855324caa0a973326018ab703254d4f8305fc0e` and:

- focused Status tests: 13/13 PASS
- marketing: 22 files / 157 tests PASS
- website-concierge: 2 files / 18 tests PASS
- full repo: 68 files / 462 tests PASS
- typecheck PASS
- changed-file lint PASS
- build PASS
- exact 3-file Status diff
- metadata unchanged
- all 11 previously OS-locked marketing surfaces unchanged
- shared `alpha.ts` and shared Button unchanged
- Last manually reviewed model correct; 2026-07-30 stamp removed
- Public booking Limited; Known Issues discloses specific-staff confirmation failure
- internal booking implementation details absent
- Customer email / SMS / payment rows correctly scoped
- Operational legend corrected
- cron/background issue not disclosed while unverified
- Status-local CTA semantics fixed
- no false live-monitoring / SLA claims
- no remaining P0 / P1 / P2 on the Status surface

---

## Visual / implementation source of truth

The locked Status baseline is commit **`c855324caa0a973326018ab703254d4f8305fc0e`** (*Correct Status public claims to current operations truth.*) on **`cursor/marketing-os-positioning`**.

Security PO-lock documentation parent: **`bd61abd6f46e8db2621dcd7ed9a861849f558546`**.

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

Canonical sources: `lib/marketing/resources-status.ts`, `components/landing/status-experience.tsx`, `app/(marketing)/status/page.tsx`.

---

## Locked architecture

Status is intentionally **static / manually reviewed during Private Alpha**.

It is **not**:

- live monitoring
- automated uptime monitoring
- real-time incident detection
- an SLA dashboard
- a public incident API
- Statuspage.io
- Better Uptime
- PagerDuty

Preserve this operating model unless a future approved architecture replaces it.

---

## Locked hero / timestamp

Eyebrow: **Status**

Headline: **Chasum System Status**

Lede: **View the current status of Chasum services and scheduled maintenance. During Private Alpha, this page is manually reviewed and updated as needed.**

Visible stamp:

**Last manually reviewed: YYYY-MM-DD**

Current approved review date: **2026-08-30**

The review date must only change after service rows, Known Issues, and planned maintenance are genuinely manually reviewed. Do **not** bump it cosmetically. Preserve `<time dateTime>`.

---

## Locked Operational definition

**No known service interruption as of the last manual review.**

Do **not** revert to “Working as expected for design partners.”

Operational does **not** mean a live probe passed, no bugs exist, every path is tested, all engineering debt is resolved, or uptime is guaranteed.

---

## Locked Current Services

### 1. Application and dashboard — Operational

Do **not** downgrade merely because it was not live-probed. No known broad application/dashboard interruption has been established.

### 2. Public booking — Limited

Deliberate. Do **not** mark Operational while the known named/specific-staff Production booking defect remains unresolved in Production. Do **not** mark Unavailable unless public booking broadly stops functioning. Do **not** rename or split this row.

### 3. Database and authentication — Operational

Do **not** rename. Do **not** downgrade solely for migration debt, Track 3 RLS incompleteness, background-job uncertainty, or missing migration-history SQL.

### 4. Customer email delivery — Configuration Required

Note: **Customer email delivery depends on platform email configuration and each business’s messaging settings.**

Distinguishes tenant/customer communications from Chasum platform email (e.g. Apply lead delivery). Do **not** imply every tenant supplies its own Resend credentials, that platform email is generally unavailable, or that all customer emails are proven working in Production.

### 5. SMS delivery — Configuration Required

Note: **SMS delivery depends on business messaging configuration and plan eligibility.**

Do **not** name Twilio on Status unless a later product-truth review explicitly authorizes it. Do **not** imply each tenant supplies its own SMS provider credentials or that SMS is currently active platform-wide.

### 6. Customer payment integrations — Configuration Required

Note: **Customer payment collection depends on the business’s payment setup.**

This row is customer-to-business payment collection. It does **not** represent Chasum SaaS subscription billing, all financial functionality, or manual payment recording. Do **not** imply Stripe is current baseline infrastructure.

---

## Locked legend

| Status | Meaning |
|--------|---------|
| Operational | No known service interruption as of the last manual review. |
| Configuration Required | Available when provider credentials are set up for your business. |
| Maintenance | Temporarily unavailable while we perform planned work. |
| Limited | Partially available; some capabilities may be reduced. |
| Unavailable | Not currently available. |

Do **not** add Degraded, Under Investigation, Known Issue, or Unverified badges without a future approved status-model decision.

---

## Locked Known Issues

**Public bookings that require selecting a specific staff member may fail during confirmation, and no appointment is created in that case. A fix is in progress.**

Customer-facing only. Do **not** expose `create_public_appointment`, migration 013, `appointment_status`, Supabase RPC details, branch names, commit SHAs, or enum internals.

This is Limited public booking, not a full booking outage, not a platform-wide outage, and not a database outage.

Optional/unassigned staff is **not** listed here (product-maturity, not this incident).

`background_jobs.next_retry_at` is **not** listed (live Production state insufficiently verified). If later verified, evaluate as background processing / communications — not automatically Database and authentication unavailable.

---

## Underlying booking defect — separate engineering

Recovery remains on `cursor/phase-5-booking-path-convergence` @ `f8478a814bf5edb056cf7399cb25fed9c0f8aade`. **Not** merged to Production/`main`. Status must remain Limited until current operational truth changes. Do **not** modify, merge, cherry-pick, or deploy that fix from Status lock work.

---

## Locked Planned Maintenance

**No planned maintenance is scheduled at this time. When maintenance is planned, it will be listed here.**

Do **not** classify ordinary engineering work or bug-fix deployments as planned maintenance unless an actual customer-impacting maintenance window is scheduled.

No incident-history system is required.

---

## Locked Support, CTA, metadata

Visible support email: **sales@chasumai.com**  
CTA: **Contact Support** → `/contact#support`

Status-local CTA semantics: one interactive Link; button-like styling on the Link; no nested Link/Button; visible focus; keyboard-native activation.

Do **not** modify Contact. Do **not** switch to `support@` or `security@`. Do **not** add response-time guarantees. This is not Pricing Priority Support.

Metadata (approved, unchanged):

- Title: **System Status**
- Description: **View the current status of Chasum services and scheduled maintenance. Manually reviewed during Private Alpha.**

---

## Internal manual-review governance (not a public promise)

Review Status when a listed service changes, when a Production defect appears or clears, after a Production deploy affecting listed services, and regularly while active Private Alpha pilots are live.

Never change the displayed review date without actually reviewing service states, Known Issues, and planned maintenance.

Do **not** publish “Updated weekly.”

Genuine operational-truth updates belong in `lib/marketing/resources-status.ts` only after that review, with the date stamp updated to the actual review date.

---

## Deferred Status / engineering debt — do not fix from this lock

1. Named/specific-staff public booking defect still not merged to Production
2. Optional/unassigned employee not Production-ready
3. `background_jobs.next_retry_at` live Production state unverified
4. Migrations **034–036 UNAPPLIED** unless later authoritative evidence says otherwise
5. Migrations **037/038** SQL absent from Git
6. Track 3 RLS incomplete
7. Live email / SMS / Stripe Production configuration not fully verified
8. No live monitoring
9. No incident history
10. No uptime / SLA tooling
11. Shared header nested Link/Button debt
12. Ask Summer 390 FAB shared debt
13. Production serving-SHA uncertainty
14. Explicit service/status aria pairing deferred
15. Status not specially mapped in concierge page-awareness

These do **not** block this marketing lock because the page now accurately represents known current truth.

---

## Allowed changes only

Future edits to Status are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Genuine manual Status truth updates after reviewing rows, Known Issues, and planned maintenance (update the review date to the actual review date; never cosmetic)
6. Claim updates required to stay aligned with Product Truth when the product owner directs

**No additional visual polish** without an explicit product-owner request. **No** live-monitoring / SLA / incident-API architecture from Status work.

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Apply, Contact, or Security as part of Status work.

Agent rule: `.cursor/rules/status-lock.mdc`

---

## Related

- Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Apply, Contact, and Security rendered surfaces from the same marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Security: [`SECURITY_V1_LOCK.md`](./SECURITY_V1_LOCK.md)
- Contact: [`CONTACT_V1_LOCK.md`](./CONTACT_V1_LOCK.md)
- Resources umbrella: [`RESOURCES_V1_LOCK.md`](./RESOURCES_V1_LOCK.md)
- Product truth: [`PRODUCT_TRUTH_MATRIX.md`](./PRODUCT_TRUTH_MATRIX.md)
