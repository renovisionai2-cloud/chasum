# GVM Baby World — Production Go-Live

Deployment and cutover plan for replacing Picktime with Chasum for **GVM Baby World Ultrasound** (`/book/gvm-baby-world`).

**Rule:** Prefer empty states over invented data. Do not redesign branding during go-live.

Companion docs: [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md), [`ROADMAP.md`](./ROADMAP.md).

---

## 1. Deployment checklist

Complete in order before accepting live patient traffic.

| # | Step | Owner | Done |
|---|------|-------|------|
| 1 | Deploy app to production host (Vercel recommended) from release commit | Eng | ☐ |
| 2 | Set production environment variables (section 2) | Eng | ☐ |
| 3 | Apply Supabase migrations **001 → 022** on production project | Eng | ☐ |
| 4 | Confirm `business-assets` storage bucket + RLS policies exist | Eng | ☐ |
| 5 | Run `node scripts/setup-gvm-baby-world.mjs` (or verify tenant already seeded) | Eng | ☐ |
| 6 | Configure Supabase Auth **custom SMTP** via Resend | Eng | ☐ |
| 7 | Sync auth email templates: `node scripts/sync-supabase-email-templates.mjs` | Eng | ☐ |
| 8 | Confirm Vercel Cron hits `/api/cron/process-jobs` every 5 minutes (`vercel.json`) | Eng | ☐ |
| 9 | `node scripts/verify-production-env.mjs` exits 0 | Eng | ☐ |
| 10 | `GET /api/health` returns `{ "ok": true }` | Eng | ☐ |
| 11 | Run verify scripts: `verify-sprint2-gvm-go-live.mjs`, `audit-business-readiness.mjs` | Eng | ☐ |
| 12 | Pass smoke test (section 4) | Staff + Eng | ☐ |
| 13 | Parallel run day (section 6) | Staff | ☐ |
| 14 | Cutover (section 5) — stop new Picktime bookings | Owner | ☐ |

---

## 2. Environment variables

Set these on the **production** host. Never commit real values.

### Required for GVM launch

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Background jobs / cron (server only) |
| `NEXT_PUBLIC_APP_URL` | Canonical HTTPS app URL (auth redirects, emails) |
| `CRON_SECRET` | Bearer token for `/api/cron/process-jobs` (Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when set) |
| `RESEND_API_KEY` | Transactional email (confirmations, reminders, cancellations) |
| `EMAIL_FROM` | Verified Resend sender, e.g. `GVM Baby World <bookings@yourdomain.com>` |

### Required for Auth password-reset / signup mail

Configure in **Supabase Dashboard → Authentication → SMTP**:

- Host / port / user / pass from Resend SMTP
- Sender aligned with `EMAIL_FROM`
- Then run `scripts/sync-supabase-email-templates.mjs` (needs `SUPABASE_ACCESS_TOKEN`)

### Optional for launch

| Variable | Purpose |
|----------|---------|
| `TWILIO_*` | SMS reminders (skip if GVM stays email-only) |
| `GOOGLE_CLIENT_*` / `MICROSOFT_CLIENT_*` | Staff calendar sync |
| `SUPABASE_ACCESS_TOKEN` | Template sync script only |

Verify locally against production env export:

```bash
node scripts/verify-production-env.mjs
# If SMS is mandatory for GVM:
node scripts/verify-production-env.mjs --strict
```

---

## 3. Production verification

### Infrastructure

| Check | How |
|-------|-----|
| Migrations | Supabase SQL history shows `001`…`013` applied |
| RLS | Owner-only access; public booking RPCs only for intended operations |
| Storage | Bucket `business-assets` public-read; owner upload under `{business_id}/…` |
| Health | `curl -sS https://<APP>/api/health` → `"ok": true`, email + cronSecret `configured` |
| Cron | Cron logs show 200; `Authorization` required in production |
| Email | Book a test appointment → Resend dashboard shows delivery; `notification_logs` status `sent` |
| Auth SMTP | Trigger password reset → inbox receives Chasum recovery mail with working link |
| Jobs | After booking, `background_jobs` rows move `pending` → `completed` within ~5 minutes |

### Runtime hardening (shipped in this release)

- Production **requires** `CRON_SECRET` — cron returns 503 if missing, 401 if wrong bearer.
- Production **does not** silently “console-log” emails — without Resend, sends fail and jobs retry.
- SMS without Twilio is **skipped** (logged), not faked as sent.
- Failed Resend sends mark `notification_logs` failed and **retry** the job until `max_attempts`.

---

## 4. GVM smoke test checklist

Run on **production** (or production-like staging) with a real Resend inbox.

| # | Workflow | Pass |
|---|----------|------|
| 1 | **New customer** — Reception `N` or Clients → create with name, phone, email | ☐ |
| 2 | **Customer search** — `/` find by name / phone / email; open preview | ☐ |
| 3 | **Book appointment** — Real slot via reception panel; status confirmed | ☐ |
| 4 | **Confirmation** — Customer email received (+ .ics); in-app notification; job completed | ☐ |
| 5 | **Reschedule** — Drag on calendar or edit dialog; success toast; reschedule email if enabled | ☐ |
| 6 | **Cancel** — Cancel in dialog; calendar clears; cancellation email if enabled | ☐ |
| 7 | **Book again + Complete** — Mark appointment completed | ☐ |
| 8 | **History** — Client profile / reception preview shows past visit | ☐ |
| 9 | **Revenue** — Dashboard / profile LTV reflects completed service price | ☐ |
| 10 | **Public book** — `/book/gvm-baby-world` end-to-end (if mode is Public / Request / Invite) | ☐ |
| 11 | **Staff Only gate** — Mode Staff Only blocks public create; restore intended mode after | ☐ |
| 12 | **Reminder job** — Optional: create appt ~25h out, wait for cron, confirm reminder email | ☐ |

Also run automated data checks when credentials are available:

```bash
node scripts/verify-sprint2-gvm-go-live.mjs
node scripts/audit-business-readiness.mjs
npm run lint && npm run build
```

---

## 5. Cutover checklist

| # | Action | Done |
|---|--------|------|
| 1 | Smoke test signed off | ☐ |
| 2 | Website / Linktree / Google Business link → `https://<APP>/book/gvm-baby-world` | ☐ |
| 3 | Booking mode set (Public **or** Staff Only + front-desk books) | ☐ |
| 4 | Staff trained on Reception shortcuts (`/`, `N`, `B`, `W`, `T`, `⌘K`) | ☐ |
| 5 | Picktime set to **read-only / no new bookings** | ☐ |
| 6 | Honor remaining Picktime appointments manually until they clear | ☐ |
| 7 | Monitor Resend + `/api/health` + cron for 48 hours | ☐ |
| 8 | Capture issues in a shared go-live channel | ☐ |

---

## 6. Parallel run checklist

Run **1–3 business days** overlapping Picktime before full cutover.

| Day | Chasum | Picktime | Done |
|-----|--------|----------|------|
| Parallel Day 1 | New bookings created in Chasum; confirmations verified | Existing appointments only | ☐ |
| Parallel Day 2 | Desk uses Reception calendar exclusively for new work | No new patients into Picktime | ☐ |
| Parallel Day 3 | Spot-check history, revenue KPI, email deliverability | Export remaining future appointments if needed | ☐ |
| Cutover | Picktime closed for intake | Chasum sole system of record | ☐ |

**Import note:** There is no automated Picktime importer. Future Picktime appointments must be re-entered or honored off-system until complete.

---

## 7. Rollback plan

If production is unsafe:

1. **Immediate:** Re-point website CTA back to Picktime; set Chasum booking mode to **Staff Only**.
2. **Freeze intake:** Do not delete data; pause marketing of the Chasum link.
3. **Triage:** Check `/api/health`, Resend logs, Supabase auth SMTP, cron 401/503 responses, `background_jobs` failures.
4. **App rollback:** Redeploy previous known-good Vercel deployment if a release regression is confirmed.
5. **Data:** Prefer forward-fix over destructive resets. Only restore DB backups for catastrophic corruption (coordinate with owner).
6. **Resume:** Fix root cause → re-run smoke test → restore public link.

---

## 8. Future Roadmap (do not build during go-live)

Documented for later — **not** required for GVM launch:

- Client self-service cancel / reschedule links
- Appointment deposits / Stripe payments
- Embeddable booking widget for the GVM website
- Custom domain (`book.gvmbabyworld.com`)
- Multi-staff logins and roles
- Twilio SMS (if not enabled at launch)
- Deep analytics / conversion reports
- Automated Picktime historical import
- Supabase Realtime calendar updates
- Playwright E2E + CI pipeline

---

## Go / No-go

**Go** when: deployment checklist complete, `/api/health` ok, smoke test passed, email + cron verified, staff trained.

**No-go** when: migrations incomplete, Resend/Auth SMTP broken, cron unauthorized/unconfigured, create/book/cancel regressions, or scheduling RPCs failing.
