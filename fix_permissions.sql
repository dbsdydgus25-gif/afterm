-- 1. Ensure 'plan' column exists
alter table profiles 
add column if not exists plan text default 'free';

-- 2. Enable RLS (if not already)
alter table profiles enable row level security;

-- 3. Drop existing policies to avoid conflicts (optional but safer for "fixing")
drop policy if exists "Users can view own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Public profiles are viewable by everyone" on profiles;

-- 4. Create "Read" policy (Allows users to see their own 'plan')
-- We allow users to read their own profile fully
create policy "Users can view own profile" 
on profiles for select 
using ( auth.uid() = id );

-- 5. Create "Update" policy
create policy "Users can update own profile" 
on profiles for update 
using ( auth.uid() = id );

-- 6. Grant access to authenticated users
grant select, update, insert on table profiles to authenticated;

-- 7. Force 'pro' for specific user (Replace EMAIL with yours if testing via SQL)
-- update profiles set plan = 'pro' where id = 'USER_UUID_GOES_HERE';
