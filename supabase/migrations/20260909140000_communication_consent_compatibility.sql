-- Package B: communication consent compatibility
-- Bounded Production drift reconciliation for the customer preference contract.
--
-- Production currently lacks customers.marketing_consent /
-- customers.marketing_consent_at, so the preference SELECT fails as a whole.
-- This file adds ONLY those two columns. It is NOT migration 027 and must not
-- be used to fill the 026–033 numbering gap.
--
-- Do NOT add: membership_id, customers_membership_idx, membership FK,
-- customer_notes.note_type, document category changes, policies, grants, or ACL.
-- Membership remains DESIGN FOR NOW / BUILD LATER (composite FK).
--
-- No backfill beyond DEFAULT false. Do not infer consent.
--
-- Future Production sequence (not authorized by this file existing in git):
--   1. schema transaction
--   2. COMMIT
--   3. NOTIFY pgrst, 'reload schema';
--   4. verify PostgREST sees the columns
--   5. deploy the Package B application
--   6. synthetic verification
-- Staging already satisfies this schema from historical 027 effects; do not
-- re-apply merely to claim migration success.

alter table public.customers
  add column if not exists marketing_consent boolean not null default false;

alter table public.customers
  add column if not exists marketing_consent_at timestamptz;

-- Required after Production COMMIT, before the new application is relied upon:
-- NOTIFY pgrst, 'reload schema';
