-- Minimal schema for payments/access.
-- Create this in your Supabase SQL editor.

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  package_id text not null,
  amount numeric not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
  created_at timestamptz not null default now(),
  checkout_id text
);

-- Optional view for quick access checks.
create index if not exists payments_phone_status_idx
  on payments (phone, status);

