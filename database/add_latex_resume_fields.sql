-- Alter existing resumes table to support LaTeX resumes
ALTER TABLE public.resumes 
ALTER COLUMN file_url DROP NOT NULL,
ALTER COLUMN file_name DROP NOT NULL,
ALTER COLUMN file_type DROP NOT NULL,
ALTER COLUMN file_size DROP NOT NULL;

ALTER TABLE public.resumes 
ADD COLUMN title text,
ADD COLUMN latex_source text,
ADD COLUMN pdf_path text,
ADD COLUMN ats_score integer,
ADD COLUMN status text default 'draft';
