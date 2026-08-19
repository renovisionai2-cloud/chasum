# World Class — Staging initialization STOP (preflight)

**Program:** Chasum World Class Program  
**Task:** Initialize empty **Chasum Staging** by replaying migrations `001`–`033`  
**Mode:** **STOPPED BEFORE SQL** — Staging target could not be positively verified in this environment  
**Branch:** `cursor/world-class-portal-foundation`  
**Branch tip at task start:** `93da746`  
**Production:** locked — `https://chasum.vercel.app`  
**Preview:** still on **Production** Supabase (no Vercel cutover)  
**Migrations 034 / 035 / 036:** **not applied** (anywhere in this task)  
**SQL executed against Staging:** **NONE**  
**SQL executed against Production:** **NONE**  
**Production data copied:** **NO**  
**Chasum HQ created:** **NO**  
**GVM modified:** **NO**  
**Phase 6.3 / 6.4:** **NOT STARTED**

PO approved Staging-only `001`–`033` replay and a schema-only compare. Those steps were **not started** because this agent cannot prove the connection target is Chasum Staging.

---

## A. Staging target verification

| Check | Result |
|-------|--------|
| Preferred tooling | `npx supabase` CLI **2.115.0** is available. `psql` is **not** installed. No `supabase/config.toml` / linked project. |
| Local env file | `.env.local` (mtime **2026-07-11**) — **before** Chasum Staging existed (2026-08-19) |
| Local project host | `kxcydvhswkuzepwzzinq.supabase.co` |
| Treat local env as | **Production / live project. Do not run migrations against it.** |
| Staging URL / anon / service role in this workspace | **Absent** (no `.env.staging.local`, no process env) |
| Database URL / direct URL | **Absent** |
| Management API PAT in `.env.local` | Present, but `GET https://api.supabase.com/v1/projects` returned **401 Unauthorized**. Cannot list projects, cannot confirm Staging ref, cannot run SQL via Management API. |
| MCP / Cursor secret store for Staging | **None** |
| Positive identification of Chasum Staging project ref | **FAILED** |
| Positive proof Production ref ≠ Staging ref | **FAILED** (Staging ref unknown here) |

**Safety rule applied:** If there is any uncertainty about the target, **STOP.** Using `.env.local` would almost certainly migrate **Production**.

Non-secret identifier recorded: local/legacy Data API host `kxcydvhswkuzepwzzinq.supabase.co` — **forbidden migration target for this task.**

---

## Smallest manual action (Product Owner)

Do **not** paste secrets into chat.

Create a **gitignored** file (`.env*` is already ignored):

**Path:** `/Users/darshan/chasum/.env.staging.local`

**Contents (placeholders only — fill from Supabase → Chasum Staging → Settings → API):**

```
CHASUM_SUPABASE_TARGET=staging
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_STAGING_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_STAGING_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_STAGING_SERVICE_ROLE_KEY
```

Then either:

1. **Preferred for a follow-up agent run:** also put a **working** personal access token in that same file as `SUPABASE_ACCESS_TOKEN=` (Supabase Account → Access Tokens). The token currently in `.env.local` is **401** against the Management API.  
   Reply in chat: `Staging env file is in place` — **do not paste keys.**

2. **Or** apply `001`–`033` yourself in the **Chasum Staging** SQL editor (project switcher must show **Chasum Staging**, Canada Central). Stop after `033`. Do not open the Production SQL editor for this work.

3. **Or** from a local terminal (after the env file exists): `npx supabase link --project-ref YOUR_STAGING_REF` then we can `db push` **only** if the linked ref is Staging. Do not link Production.

Until one of those exists, this agent must not execute SQL.

---

## B. PostgreSQL version

**Unknown** — Staging was not queried.

---

## C. Migration replay result 001–033

**NOT STARTED.** Zero files applied.

Preflight still believes sequential `001`→`033` on a **clean empty** database is the approved method (`006` comments-only; `007` DELETE no-ops when empty; `030`/`031` are idempotent repairs). That assessment is unchanged from the discovery doc. It was not executed.

---

## D. Confirmation 034–036 NOT applied

**Confirmed for this task:** no SQL of any kind was sent. `034` / `035` / `036` were not applied.

---

## E–H. Inventories / Data API / Storage

**Not collected.** Staging schema was not initialized.

---

## I–K. Schema-only Production comparison

**Not performed.** No Production schema dump. No Staging schema to compare.

Whether repo migrations fully reconstruct Production: **UNKNOWN** until Staging exists.

---

## L. Auth configuration still required (unchanged)

Before Preview cutover (not this task):

- Staging Auth **Site URL** = Preview origin, not `https://chasum.vercel.app`
- Redirects: Preview `/auth/callback`, `/reset-password`, plus local `http://localhost:3000/**` if local uses Staging
- Email confirmation: PO choice; default Supabase mailer is enough for **internal** test signups
- Password reset: same `/auth/callback?next=/reset-password` contract
- SMTP / branded templates: optional until Preview cutover; `scripts/sync-supabase-email-templates.mjs` must be pointed at **Staging** URL
- **Do not** copy Production Auth users

---

## M. External integration configuration still required

Before Preview cutover (not this task):

- **Resend:** dedicated Staging/test key, or omit (Preview runtime will **fail** send, not console-fake)
- **Twilio:** unset or test
- **Stripe:** unset or `sk_test_`; no Production webhook to Preview
- Recipients: team/test addresses only

Not configured in this task. No messages sent.

---

## N. Preview cutover readiness

**NO**

Staging schema does not exist in this environment. Preview remains on Production by design until a later explicit PO cutover.

---

## O. Exact blockers before Preview cutover

1. Staging credentials available to the operator/agent **without** using Production `.env.local`  
2. Positive project-ref proof: name **Chasum Staging**, Canada Central, **empty**, **≠** `kxcydvhswkuzepwzzinq`  
3. Apply `001`–`033` on that target  
4. Leave `034`–`036` unapplied  
5. Data API exposure check (auto-expose was OFF at project creation)  
6. Storage `business-assets` empty bucket  
7. Schema-only compare vs Production  
8. Staging Auth Site URL / redirects  
9. Separate Resend/Twilio/Stripe from Production  
10. Explicit PO approval to change **Preview-only** Vercel env (not granted in this task)

---

## P. Test data next?

**NO** — schema not initialized. Even after init, prior PO instruction was: no GVM Test / HQ / customers until schema + Auth + env validation.

---

## Q. RLS hardening on Staging?

**NO** — no Staging schema yet. After init, baseline must first reproduce Production-era policies (including public businesses SELECT). Hardening is a later Staging-only task.

---

## R–X. Locks

| | |
|--|--|
| **R** Production DB impact | **NONE** |
| **S** Production application impact | **NONE** |
| **T** GVM impact | **NONE** |
| **U** Production data copied | **NO** |
| **V** Chasum HQ created | **NO** |
| **W** Phase 6.3 implementation | **NOT STARTED** |
| **X** Phase 6.4 | **NOT STARTED** |

---

## Environment contract (still locked)

| Surface | Database |
|---------|----------|
| Production (`https://chasum.vercel.app`) | Production Supabase **only** |
| Preview | Production Supabase **until** a later PO-approved cutover |
| Local | Do **not** use Production for World Class DB writes; after Staging init, local should use Staging |
| Migrations | Staging first → PO test → explicit Production approval → Production |

---

*Stopped for Product Owner: add `.env.staging.local` (or SQL-editor apply on Chasum Staging). Do not connect Vercel Preview yet.*
