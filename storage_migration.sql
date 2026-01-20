-- Create profiles table to track storage usage
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  storage_used bigint default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Alter messages table to support file upload
alter table public.messages 
add column if not exists file_url text,
add column if not exists file_path text,
add column if not exists file_size bigint default 0,
add column if not exists file_type text;

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policy: Users can view their own profile
create policy "Users can view own profile" 
on public.profiles for select 
using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- Trigger to create profile on signup (optional but good practice)
-- For now, we'll handle creation on first save if not exists, or manual insert.
