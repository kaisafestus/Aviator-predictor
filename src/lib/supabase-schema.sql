-- Minimal schema for payments/access.
-- Create this in your Supabase SQL editor.
-- Supabase schema for Aviator (payments + packages)
-- Run this SQL in the Supabase SQL editor for a new project.

-- Required extension for `gen_random_uuid()` used for IDs.
create extension if not exists pgcrypto;

-- Packages table (optional): allows storing package metadata in DB
create table if not exists packages (
  id text primary key,
  name text not null,
  price numeric not null,
  duration_minutes integer not null,
  popular boolean not null default false,
  created_at timestamptz not null default now()
);

-- Seed example packages used by the frontend (only insert if not exists)
insert into packages (id, name, price, duration_minutes, popular)
select * from (values
  ('basic', 'BASIC 30MIN', 100, 30, false),
  ('pro', 'PRO 2HR', 500, 120, true),
  ('vip', 'VIP 24HR', 2000, 1440, false)
) as v(id, name, price, duration_minutes, popular)
where not exists (select 1 from packages p where p.id = v.id);


-- Payments table: records payment attempts and statuses
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  package_id text not null references packages(id) on update cascade on delete restrict,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  created_at timestamptz not null default now(),
  checkout_id text
);

-- Indexes for common queries
create index if not exists payments_phone_status_idx
  on payments (phone, status);

create index if not exists payments_checkout_id_idx
  on payments (checkout_id);

-- View for quick access checks (returns latest paid payment per phone)
create or replace view latest_paid_payments as
select distinct on (phone) id, phone, package_id, amount, status, created_at, checkout_id
from payments
where status = 'paid'
order by phone, created_at desc;

-- Note: Row Level Security (RLS) is intentionally not enabled here. If you
-- plan to use Supabase client-side access for writes/reads, enable RLS and
-- create appropriate policies. This project uses a server-side service role
-- (`SUPABASE_SERVICE_ROLE_KEY`) for write operations in `src/app/api`.


