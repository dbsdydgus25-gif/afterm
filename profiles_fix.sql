-- Fix: Add missing INSERT policy for profiles table
-- This allows users to create their own profile row if it doesn't exist.

create policy "Users can insert own profile" 
on public.profiles for insert 
to authenticated 
with check (auth.uid() = id);
