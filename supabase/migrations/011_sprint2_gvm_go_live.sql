-- Sprint 2: GVM Baby World go-live — business profile, service booking fields, staff profile

-- Business contact & branding
alter table businesses
  add column if not exists logo_url text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists website text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text default 'US',
  add column if not exists booking_policy text,
  add column if not exists social_links jsonb not null default '{}'::jsonb;

-- Service online booking + preparation
alter table services
  add column if not exists online_booking boolean not null default true,
  add column if not exists preparation_instructions text;

-- Staff biography & qualifications
alter table staff
  add column if not exists biography text,
  add column if not exists qualifications text;

comment on column businesses.logo_url is 'Public URL for business logo (settings / booking header)';
comment on column businesses.social_links is 'JSON map e.g. {instagram, facebook, tiktok, youtube}';
comment on column services.online_booking is 'When false, service is dashboard-only (hidden from public booking)';
comment on column services.preparation_instructions is 'Shown to clients during public booking';
comment on column staff.biography is 'Public-facing bio on booking provider step';
comment on column staff.qualifications is 'Credentials / certifications shown to clients';
