-- ZaMaGui / Supabase PostgreSQL foundation.
-- DRAFT ONLY. Not applied to any database.
-- Client roles may read published services/projects; all lead and finance writes are server-side.
create extension if not exists pgcrypto;

create table if not exists public.zmg_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  direction text not null check (direction in ('growth','capital','guild','marketplace','franchise','kids','ai')),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  title_i18n jsonb not null default '{}'::jsonb,
  description_i18n jsonb not null default '{}'::jsonb,
  price_from numeric(14,2) check (price_from is null or price_from >= 0),
  currency_code text not null default 'UAH' check (currency_code ~ '^[A-Z]{3}$'),
  owner_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zmg_services_published_translations check (
    status <> 'published' or
    (title_i18n ?& array['uk','ru','en'])
  )
);

create table if not exists public.zmg_projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_i18n jsonb not null default '{}'::jsonb,
  status text not null default 'idea'
    check (status in ('idea','validating','pilot','operating','scaling','paused','archived')),
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  is_published boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint zmg_projects_published_translations check (
    is_published = false or name_i18n ?& array['uk','ru','en']
  )
);

create table if not exists public.zmg_leads (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.zmg_services(id) on delete set null,
  project_id uuid references public.zmg_projects(id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text,
  phone text,
  message text check (char_length(message) <= 8000),
  locale text not null default 'uk' check (locale in ('uk','ru','en')),
  source text,
  utm jsonb not null default '{}'::jsonb,
  privacy_notice_version text not null,
  marketing_opt_in boolean not null default false,
  status text not null default 'new'
    check (status in ('new','qualified','contacted','won','lost','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint zmg_leads_contact_required check (
    nullif(btrim(coalesce(email,'')), '') is not null or
    nullif(btrim(coalesce(phone,'')), '') is not null
  )
);

create table if not exists public.zmg_finance_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.zmg_projects(id) on delete restrict,
  entry_type text not null check (entry_type in ('actual','forecast','commitment')),
  category text not null check (category in ('revenue','expense','investment','refund')),
  amount numeric(14,2) not null check (amount >= 0),
  currency_code text not null default 'UAH' check (currency_code ~ '^[A-Z]{3}$'),
  effective_date date not null,
  source_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.zmg_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_reference text,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists zmg_services_published_idx
  on public.zmg_services (status, direction);
create index if not exists zmg_projects_public_idx
  on public.zmg_projects (is_published, status);
create index if not exists zmg_leads_created_idx
  on public.zmg_leads (created_at desc);
create index if not exists zmg_leads_status_idx
  on public.zmg_leads (status, created_at desc);
create index if not exists zmg_finance_project_date_idx
  on public.zmg_finance_entries (project_id, effective_date desc);
create index if not exists zmg_audit_events_created_idx
  on public.zmg_audit_events (created_at desc);

-- Deny client access by default, including cached PostgreSQL default grants.
alter table public.zmg_services enable row level security;
alter table public.zmg_projects enable row level security;
alter table public.zmg_leads enable row level security;
alter table public.zmg_finance_entries enable row level security;
alter table public.zmg_audit_events enable row level security;

revoke all on table
  public.zmg_services, public.zmg_projects, public.zmg_leads,
  public.zmg_finance_entries, public.zmg_audit_events
  from anon, authenticated;

grant select on public.zmg_services, public.zmg_projects to anon, authenticated;

create policy zmg_services_public_published
  on public.zmg_services for select to anon, authenticated
  using (status = 'published');

create policy zmg_projects_public_published
  on public.zmg_projects for select to anon, authenticated
  using (is_published = true);

-- No public INSERT / UPDATE / DELETE on any table.
-- No anonymous or authenticated access to leads, finance, or audit events.
-- Only authenticated, rate-limited server endpoints with service-role privilege
-- should validate and write new leads or finance entries.
