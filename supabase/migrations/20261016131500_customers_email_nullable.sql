-- GVM-N01 / Issue #167
-- Staff may create a customer with a usable phone and no email.
-- NULL means "no email". The application must never store '' or a
-- manufactured @chasum.local address.
--
-- Preserved on purpose:
--   UNIQUE (business_id, email) — NULL does not collide with NULL
--   UNIQUE (id, business_id)
--   primary key, foreign keys, RLS, triggers, and every existing row
--
-- Not included: backfill, phone uniqueness, phone index, constraint drops.
--
-- Lock: ALTER COLUMN ... DROP NOT NULL takes ACCESS EXCLUSIVE on
-- public.customers for a short catalog update. It does not rewrite the
-- table, but it is not lock-free and can briefly block other sessions.
-- Apply this migration before any build that inserts NULL emails.
-- SET NOT NULL later fails if any NULL email exists. Do not invent an
-- address to force that rollback.

ALTER TABLE public.customers
  ALTER COLUMN email DROP NOT NULL;
