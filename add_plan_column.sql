-- Add 'plan' column to profiles table if it doesn't exist
alter table profiles 
add column if not exists plan text default 'free';

-- Update existing users to 'free' if null
update profiles set plan = 'free' where plan is null;

-- OPTIONAL: Manually upgrade a specific user to 'pro' for testing
-- update profiles set plan = 'pro' where email = 'your_email@example.com';
