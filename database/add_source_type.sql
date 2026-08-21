-- Add source_type column to resumes table to distinguish between latex and uploaded resumes
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'latex';

-- Create resumes bucket if it doesn't exist (must be done in Supabase UI or via Service Role)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false) ON CONFLICT DO NOTHING;

-- RLS for storage.objects (if not already applied)
-- CREATE POLICY "Users can upload their own resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid() = owner);
-- CREATE POLICY "Users can view their own resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes' AND auth.uid() = owner);
-- CREATE POLICY "Users can update their own resumes" ON storage.objects FOR UPDATE USING (bucket_id = 'resumes' AND auth.uid() = owner);
-- CREATE POLICY "Users can delete their own resumes" ON storage.objects FOR DELETE USING (bucket_id = 'resumes' AND auth.uid() = owner);
