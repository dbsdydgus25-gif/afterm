-- Create Memorials Table
create table public.memorials (
  id uuid not null default gen_random_uuid (),
  name text not null,
  birth_date text not null,  -- Storing as text for simplicity 'YYYY.MM.DD'
  death_date text not null,
  bio text not null,
  profile_image text not null,
  cover_image text not null,
  tribute_count integer default 0,
  user_id uuid references auth.users (id),
  created_at timestamp with time zone not null default now(),
  constraint memorials_pkey primary key (id)
);

-- Create Posts Table
create table public.posts (
  id uuid not null default gen_random_uuid (),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  author_name text not null, -- Snapshot of name at time of posting or display name
  content text not null,
  media_url text,
  media_type text check (media_type in ('image', 'video')),
  likes integer default 0,
  created_at timestamp with time zone not null default now(),
  user_id uuid references auth.users (id),
  constraint posts_pkey primary key (id)
);

-- Create Tributes Table (to track who tributed, preventing multi-tribute spam if desired, or just log)
create table public.tributes (
  id uuid not null default gen_random_uuid (),
  memorial_id uuid not null references public.memorials (id) on delete cascade,
  user_id uuid references auth.users (id),
  created_at timestamp with time zone not null default now(),
  constraint tributes_pkey primary key (id)
);

-- Enable Row Level Security (RLS)
alter table public.memorials enable row level security;
alter table public.posts enable row level security;
alter table public.tributes enable row level security;

-- Policies (Simple Public Read, Auth Write for MVP)

-- Memorials: Everyone can read, Authenticated users can create
create policy "Memorials are viewable by everyone" on public.memorials
  for select using (true);

create policy "Users can insert their own memorials" on public.memorials
  for insert with check (auth.uid() = user_id);

-- Posts: Everyone can read, Authenticated users can create
create policy "Posts are viewable by everyone" on public.posts
  for select using (true);

create policy "Authenticated users can create posts" on public.posts
  for insert with check (auth.role() = 'authenticated');

-- Tributes: Everyone can read, Anyone can insert (or restrict to auth)
create policy "Tributes read" on public.tributes for select using (true);
create policy "Tributes insert" on public.tributes for insert with check (true);

-- Function to increment memorial tribute count on tribute insert
create or replace function public.handle_new_tribute()
returns trigger as $$
begin
  update public.memorials
  set tribute_count = tribute_count + 1
  where id = new.memorial_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for tribute count
create trigger on_tribute_created
  after insert on public.tributes
  for each row execute procedure public.handle_new_tribute();
