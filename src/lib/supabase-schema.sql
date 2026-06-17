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
  payhero_transaction_id text,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure columns exist if the table was created by an older version of the schema
alter table payments add column if not exists payhero_transaction_id text;
alter table payments add column if not exists provider_response jsonb;
alter table payments add column if not exists updated_at timestamptz not null default now();

-- Auto-update updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

create trigger update_payments_updated_at
before update on payments
for each row execute function update_updated_at_column();

-- Indexes for common queries
create index if not exists payments_phone_status_idx
  on payments (phone, status);

create index if not exists payments_transaction_id_idx
  on payments (payhero_transaction_id);

-- View for quick access checks (returns latest paid payment per phone)
drop view if exists latest_paid_payments;
create or replace view latest_paid_payments as
select distinct on (phone) id, phone, package_id, amount, status, created_at, payhero_transaction_id
from payments
where status = 'paid'
order by phone, created_at desc;

-- Note: Row Level Security (RLS) is intentionally not enabled here. If you
-- plan to use Supabase client-side access for writes/reads, enable RLS and
-- create appropriate policies. This project uses a server-side service role
-- (`SUPABASE_SERVICE_ROLE_KEY`) for write operations in `src/app/api`.
