# Security — PO LOCK

| Field | Value |
|-------|--------|
| **STATUS** | ✅ APPROVED / LOCKED |
| **SURFACE** | Marketing Website → Security (`/security`) |
| **VERSION** | Security V1 current-generation PO lock · 2026-08-30 |
| **STATE** | **Locked** |
| **Approved** | 2026-08-30 |
| **Approved by** | Product Owner |
| **Claude independent audit** | APPROVED — SECURITY READY FOR PO LOCK |
| **PO visual evidence** | SECURITY PO VISUAL REVIEW — PASS |
| **Branch** | `cursor/marketing-os-positioning` |
| **Approved SHA** | `8a4be655edd74c5cd7875d68acf93b476ac553fe` |
| **Contact lock documentation parent** | `902087b22568eab5817568ef78e0caa1191d57fc` |
| **In Production?** | **No.** Do not treat this lock as a Production deploy. `origin/main` / Production pin remains `476af17bfd06113281df0b5c33f995ccb26f5fff`. |

---

## SECURITY — PO LOCKED

Date: 2026-08-30  
Approved SHA: `8a4be655edd74c5cd7875d68acf93b476ac553fe`  
Claude: **APPROVED — SECURITY READY FOR PO LOCK**  
PO: **APPROVED**  
Visual: **SECURITY PO VISUAL REVIEW — PASS**

Status:

- Marketing branch only.
- Not merged to `main`.
- Not deployed to Production.

This file is the **only** canonical current Security lock.

---

## Historical July 2026 Security lock — SUPERSEDED

The previous Security **v1** lock (2026-07-30) is **historical / superseded**. It predates the Level 3 security / product-truth review.

| Field | Historical value (do not restore as current truth) |
|-------|--------|
| **Approved** | 2026-07-30 |
| **Preview visual SoT** | https://chasum-6vr9wmadu-renovisionappcom.vercel.app/security |
| **Implementation baseline** | `4013db0` (*Lock Security v1 with the final hero headline*) |

That generation locked visual structure **and** public claims that later failed product-truth review, including:

- Trusted Infrastructure listing Stripe and Twilio as unqualified current infrastructure
- Automatic Backups / managed-cloud backup wording without proven frequency, PITR, restore test, or runbook
- “All communication is encrypted using HTTPS”
- “modern authentication and encrypted sessions”
- “Every business has its own secure workspace” as an underspecified isolation claim
- nested Link/Button Security CTAs

Do **not** restore July 2026 Security copy, the July Preview URL as current product-truth, or commit `4013db0` as the current Security baseline.

Hero headline and overall visual structure from that generation remain the approved **layout** lineage. Current **claim** truth is SHA `8a4be655edd74c5cd7875d68acf93b476ac553fe` only.

---

## Approval evidence (2026-08-30)

- Initial PO rendered visual review (visual foundation PASS)
- Cursor Level 3 security / product-truth preflight
- Claude independent Level 3 pre-implementation challenge
- ChatGPT reconciliation
- Bounded Security truth-correction implementation
- Fresh PO rendered review of the corrected Preview
- Independent Claude final pre-lock audit
- Claude verdict: **APPROVED — SECURITY READY FOR PO LOCK**
- PO visual: **SECURITY PO VISUAL REVIEW — PASS**
- PO: **APPROVED**

Claude independently confirmed SHA `8a4be655edd74c5cd7875d68acf93b476ac553fe` and:

- focused Security tests: 10/10 PASS
- marketing + website-concierge: 23 files / 162 tests PASS
- full repo: 67 files / 449 tests PASS
- typecheck PASS
- changed-file lint PASS
- build PASS
- exact 3-file candidate diff
- all 10 previously OS-locked marketing surfaces unchanged
- shared `alpha.ts` and shared Button unchanged
- prior P1 Stripe/Twilio and Automatic Backups claims resolved
- no backup / PITR / RPO / RTO public claim
- transparency section preserved exactly
- certification / compliance overclaims absent
- CTA semantics and Status / Contact routes correct
- no remaining P0 / P1 / P2 on the Security surface

This lock identifies the **exact SHA**, **exact surface**, **exact date**, Claude approval, and PO approval so this accepted generation cannot be confused with July 2026.

---

## Visual / implementation source of truth

The locked Security baseline is commit **`8a4be655edd74c5cd7875d68acf93b476ac553fe`** (*Correct Security public claims to current infrastructure truth.*) on **`cursor/marketing-os-positioning`**.

Contact PO-lock documentation parent: **`902087b22568eab5817568ef78e0caa1191d57fc`**.

This state lives on **`cursor/marketing-os-positioning`**. It is **not** merged to `main` and is **not** in Production.

Canonical sources: `lib/marketing/resources-security.ts`, `components/landing/security-experience.tsx`, `app/(marketing)/security/page.tsx`.

PO visual evidence recorded: hero, six-card balance, corrected card copy fit, database-style icon for Managed Data Infrastructure, transparency intact, Status / Contact Support styling after semantic fix, footer / Ask Summer visually consistent, no obvious clipping or wrapping failure.

---

## Locked hero / structure

Eyebrow: **Security**

Headline: **Security Designed Around Your Business**

Lede: **Your business data matters. Chasum is designed with careful safeguards from the start—so you can focus on customers with confidence.**

Preserve six-card grid, Private Alpha Transparency section, and “Questions about security?” closing section. This is not a redesign lock on engineering controls.

---

## Locked Security cards

### 1. Secure Authentication

**Accounts use Supabase-powered authentication with secure sign-in and session handling.**

Do **not** broaden into MFA, passkeys, SSO, enterprise IdP, OAuth login, advanced identity assurance, or application-layer encrypted sessions without future proof and PO approval.

### 2. Protected Business Data

**Business data is organized within its own workspace, with access controls designed to keep it separate from other businesses.**

Intentionally non-absolute. Do **not** change to “only your team,” “nobody at Chasum,” separate physical database per tenant, perfect isolation, zero privileged access, or fully audited tenant isolation without future evidence and approval.

### 3. Encrypted Connections

**Connections to Chasum use HTTPS.**

Do **not** revert to “All communication is encrypted using HTTPS.” Do **not** add end-to-end encryption, encrypted email/SMS, all-communications encryption, or encrypted provider delivery.

### 4. Trusted Infrastructure

**Chasum uses established cloud providers for hosting, authentication, data storage, and communications.**

Generic category wording is intentional. Do **not** reintroduce an unqualified current-provider list. Do **not** list Stripe, Twilio, or Sentry as baseline current Security infrastructure without a separate verified product-truth review. Do **not** add vendor certifications.

### 5. Managed Data Infrastructure

**Business data is stored using managed cloud infrastructure.**

Replaced **Automatic Backups**. No public backup guarantee currently exists. Do **not** add automatic/regular/daily/provider-managed/encrypted backups, PITR, restore/disaster-recovery guarantees, RPO, or RTO without separately verified operational evidence and PO approval. Database-style icon is approved.

### 6. Continuous Security Improvements

**Security evolves alongside Chasum as we continue building.**

Modest Private Alpha commitment. Do **not** turn into 24/7 monitoring, continuous vulnerability scanning, threat detection, SOC operations, or pentest cadence without evidence.

---

## Private Alpha Transparency — locked

Preserve visible wording:

- We don't claim certifications we haven't earned.
- We continuously improve security as Chasum grows.
- We follow responsible engineering practices.
- We value transparency over marketing language.

Preserve:

**Private Alpha is not a finished enterprise security program. Production-critical guarantees, when needed, are confirmed in writing during onboarding—not as vague public promises.**

This section is a governing public trust standard.

---

## Certification / compliance guardrail

Security currently does **not** claim SOC 2, SOC 1, ISO 27001, PCI DSS, HIPAA, PIPEDA, GDPR, CCPA, PHIPA, HITECH, CSA STAR, penetration testing, certified, compliant, or audited. That absence is deliberate. Future certification/compliance claims require separate evidence and approval.

---

## Locked CTAs and metadata

View System Status → `/status`  
Contact Support → `/contact#support`

Security-local CTA semantics: one interactive Link per CTA; button-like styling on the Link; no nested Link/Button; decorative Status arrow `aria-hidden`; keyboard/focus preserved.

Metadata (approved, conservative):

**Security built into Chasum—secure authentication, protected business workspaces, encrypted connections, and honest Private Alpha transparency.**

Do **not** modify Contact or Status from Security lock work.

---

## Why prior wording was corrected (Level 3)

**Resolved P1**

1. Trusted Infrastructure listed Stripe and Twilio as unqualified current infrastructure. Resolved by generic cloud-provider category wording.
2. Automatic Backups claimed a backup state that was not sufficiently proven. Resolved by Managed Data Infrastructure / stored-on-managed-cloud wording with no backup guarantee.

**Resolved P2**

- “All communication is encrypted using HTTPS” narrowed to connections to Chasum over HTTPS.
- “modern authentication and encrypted sessions” narrowed to Supabase-powered sign-in and session handling.
- Tenant/workspace wording tightened without absolute isolation promises.
- Security CTA nested Link/Button semantics fixed locally.

---

## Deferred engineering / security debt — do not fix from this lock

1. Track 3 RLS hardening remains incomplete
2. Migrations **034–036 UNAPPLIED** unless authoritative live state later says otherwise
3. Migrations **037/038** SQL absent from Git
4. No formal backup/restore runbook
5. No verified PITR / RPO / RTO
6. Stripe SaaS billing remains mock
7. Twilio remains optional / configuration-dependent
8. Sentry configuration remains unverified
9. No proven configured CSP / HSTS / etc. from Chasum `next.config`
10. No `security@` inbox
11. Platform Admin / service-role privileged access exists by design
12. Public catalog policies exist by design
13. Shared header nested Link/Button debt remains
14. Ask Summer 390 FAB issue remains
15. Security tooling maturity (CodeQL / Dependabot / SAST / pentest) remains future work unless separately completed

These do **not** block this marketing lock because the page no longer overclaims them.

---

## Allowed changes only

Future edits to Security are permitted **only** for:

1. Bug fixes
2. Broken responsive layouts
3. Accessibility fixes
4. Product changes **explicitly requested by the product owner**
5. Claim updates required to stay aligned with Product Truth when the product owner directs

**No additional visual polish** without an explicit product-owner request.

Do **not** edit locked Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Apply, or Contact as part of Security work.

Agent rule: `.cursor/rules/security-lock.mdc`

---

## Related

- Homepage, Platform, Meet Summer, Product Tour, Industries, Roadmap, Pricing, Why Private Alpha, Apply, and Contact rendered surfaces from the same marketing OS chapter are also **LOCKED** (see [`docs/CURRENT_PROJECT_STATE.md`](../CURRENT_PROJECT_STATE.md)). Those locks are **not** in Production.
- Contact: [`CONTACT_V1_LOCK.md`](./CONTACT_V1_LOCK.md)
- Resources umbrella / Status: [`RESOURCES_V1_LOCK.md`](./RESOURCES_V1_LOCK.md)
- Product truth: [`PRODUCT_TRUTH_MATRIX.md`](./PRODUCT_TRUTH_MATRIX.md)
