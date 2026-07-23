-- 1. Create Resumes Table
create table public.resumes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size integer not null,
  parsed_text text,
  extracted_skills jsonb,
  raw_json jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.resumes enable row level security;

-- 3. Create Policies
create policy "Users can insert their own resumes." on public.resumes
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own resumes." on public.resumes
  for select using (auth.uid() = user_id);

create policy "Users can update their own resumes." on public.resumes
  for update using (auth.uid() = user_id);

create policy "Users can delete their own resumes." on public.resumes
  for delete using (auth.uid() = user_id);

-- IMPORTANT STORAGE INSTRUCTIONS:
-- 1. Go to Supabase Storage in your dashboard.
-- 2. Create a new bucket named "resumes".
-- 3. Make sure the bucket is Private (do NOT check "Public bucket").
-- 4. Add the following Storage RLS Policies for the "resumes" bucket:
--    - SELECT: `(bucket_id = 'resumes'::text) AND (auth.uid() = owner)`
--    - INSERT: `(bucket_id = 'resumes'::text) AND (auth.uid() = owner)`
--    - UPDATE: `(bucket_id = 'resumes'::text) AND (auth.uid() = owner)`
--    - DELETE: `(bucket_id = 'resumes'::text) AND (auth.uid() = owner)`
