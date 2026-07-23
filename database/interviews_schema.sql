-- 1. Create Interviews Table
create table public.interviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  resume_id uuid references public.resumes on delete set null,
  status text not null default 'pending', -- pending, in_progress, completed
  questions jsonb not null, -- Array of generated questions
  current_question_index integer default 0,
  score integer,
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.interviews enable row level security;

-- 3. Create Policies
create policy "Users can insert their own interviews." on public.interviews
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own interviews." on public.interviews
  for select using (auth.uid() = user_id);

create policy "Users can update their own interviews." on public.interviews
  for update using (auth.uid() = user_id);

create policy "Users can delete their own interviews." on public.interviews
  for delete using (auth.uid() = user_id);
