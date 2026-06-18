-- Supabase schema for Aviator (payments + packages)
-- Safe to run on both fresh and existing databases.
-- All destructive operations use DROP IF EXISTS first.

-- ─── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─── Packages table ───────────────────────────────────────────────────────────
create table if not exists packages (
  id               text        primary key,
  name             text        not null,
  price            numeric     not null,
  duration_minutes integer     not null,
  popular          boolean     not null default false,
  created_at       timestamptz not null default now()
);

-- Seed packages (skip rows that already exist)
insert into packages (id, name, price, duration_minutes, popular)
select * from (values
  ('basic', 'BASIC 30MIN', 100,  30,   false),
  ('pro',   'PRO 2HR',     500,  120,  true),
  ('vip',   'VIP 24HR',    2000, 1440, false)
) as v(id, name, price, duration_minutes, popular)
where not exists (select 1 from packages p where p.id = v.id);

-- ─── Payments table ───────────────────────────────────────────────────────────
create table if not exists payments (
  id                      uuid        primary key default gen_random_uuid(),
  phone                   text        not null,
  package_id              text        not null references packages(id) on update cascade on delete restrict,
  amount                  numeric     not null,
  status                  text        not null default 'pending'
                            check (status in ('pending','paid','failed','cancelled')),
  checkout_id             text,
  payhero_transaction_id  text,
  provider_response       jsonb,
  expires_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Add columns safely (no-op if they already exist)
alter table payments add column if not exists checkout_id            text;
alter table payments add column if not exists payhero_transaction_id text;
alter table payments add column if not exists provider_response      jsonb;
alter table payments add column if not exists expires_at             timestamptz;
alter table payments add column if not exists updated_at             timestamptz not null default now();

-- ─── auto-update updated_at ───────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Drop before re-create to avoid the "already exists" error
drop trigger if exists update_payments_updated_at on payments;
create trigger update_payments_updated_at
  before update on payments
  for each row execute function update_updated_at_column();

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists payments_phone_status_idx     on payments (phone, status);
create index if not exists payments_transaction_id_idx   on payments (payhero_transaction_id);
create index if not exists payments_checkout_id_idx      on payments (checkout_id);
create index if not exists payments_phone_expires_idx    on payments (phone, expires_at);

-- ─── View: latest active paid payment per phone ───────────────────────────────
drop view if exists latest_paid_payments;
create view latest_paid_payments as
select distinct on (phone)
  id,
  phone,
  package_id,
  amount,
  status,
  created_at,
  expires_at,
  payhero_transaction_id
from payments
where status = 'paid'
  and (expires_at is null or expires_at > now())
order by phone, created_at desc;

-- ─── Notes ────────────────────────────────────────────────────────────────────
-- RLS is intentionally disabled. All writes go through server-side API routes
-- using SUPABASE_SERVICE_ROLE_KEY (src/lib/supabase-admin.ts).
