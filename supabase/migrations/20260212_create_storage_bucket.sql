-- Create the storage bucket for AI Memorial Chat data
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'memorial-data', 
  'memorial-data', 
  true, 
  52428800, -- 50MB
  '{image/png,image/jpeg,image/jpg,image/webp}'
)
on conflict (id) do nothing;

-- Policy: Allow public access to view files (for AI analysis)
create policy "Public Access memorial-data"
  on storage.objects for select
  using ( bucket_id = 'memorial-data' );

-- Policy: Allow authenticated users to upload files
create policy "Authenticated upload memorial-data"
  on storage.objects for insert
  with check ( bucket_id = 'memorial-data' and auth.role() = 'authenticated' );

-- Policy: Users can update their own files
create policy "Owner update memorial-data"
  on storage.objects for update
  using ( bucket_id = 'memorial-data' and auth.uid() = owner );
