-- Enable RLS on storage.objects if not already enabled (it usually is by default)
-- alter table storage.objects enable row level security;

-- 1. Allow Users to Upload (INSERT) to their own folder
create policy "Users can upload their own memories"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'memories' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow Users to View (SELECT) their own memories
create policy "Users can view their own memories"
on storage.objects for select
to authenticated
using (
  bucket_id = 'memories' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow Users to Update (UPDATE) their own memories
create policy "Users can update their own memories"
on storage.objects for update
to authenticated
using (
  bucket_id = 'memories' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow Users to Delete (DELETE) their own memories
create policy "Users can delete their own memories"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'memories' and
  (storage.foldername(name))[1] = auth.uid()::text
);
