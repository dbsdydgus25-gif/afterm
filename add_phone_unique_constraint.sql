-- Clean up duplicate phones if any (Optional - assumes fresh start or manual cleanup if needed)
-- For now, we assume no critical duplicates exists or we let the migration fail if so.
-- But to be safe, we will just try to add the constraint.

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);
