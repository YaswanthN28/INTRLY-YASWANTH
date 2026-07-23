-- Run this in your Supabase SQL Editor to add transcript storage to the interviews table.

-- Add transcripts column (maps question_id -> candidate's spoken answer text)
alter table public.interviews
  add column if not exists transcripts jsonb default '{}'::jsonb;

-- Add current_question_index if not present
alter table public.interviews
  add column if not exists current_question_index integer default 0;
