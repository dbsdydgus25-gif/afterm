-- Create table if not exists
create table if not exists public.verification_codes (
    id uuid primary key default gen_random_uuid(),
    phone text not null,
    code text not null,
    expires_at timestamptz not null,
    created_at timestamptz default now()
);

-- Indices
create index if not exists idx_vc_phone on public.verification_codes(phone);
create index if not exists idx_vc_expires on public.verification_codes(expires_at);

-- RLS
alter table public.verification_codes enable row level security;

-- Drop policy if exists to avoid error on recreation
drop policy if exists "Service role full access" on public.verification_codes;

-- Create policy
create policy "Service role full access"
  on public.verification_codes
  for all
  to service_role
  using (true)
  with check (true);
