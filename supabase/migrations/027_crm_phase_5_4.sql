-- Phase 5.4 — CRM enhancements: marketing consent, note types, membership link

alter table customers
  add column if not exists marketing_consent boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists membership_id uuid references memberships(id) on delete set null;

create index if not exists customers_membership_idx
  on customers (membership_id)
  where membership_id is not null;

alter table customer_notes
  add column if not exists note_type text not null default 'general';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customer_notes_note_type_check'
  ) then
    alter table customer_notes
      add constraint customer_notes_note_type_check
      check (note_type in ('general', 'warning', 'medical', 'service'));
  end if;
end $$;

-- Ensure document category column exists (018 may already have added it)
alter table customer_documents
  add column if not exists category text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customer_documents_category_check'
  ) then
    alter table customer_documents
      add constraint customer_documents_category_check
      check (
        category is null
        or category in (
          'general',
          'waiver',
          'consent',
          'intake',
          'photo',
          'id',
          'insurance',
          'other'
        )
      );
  end if;
exception
  when duplicate_object then null;
end $$;
