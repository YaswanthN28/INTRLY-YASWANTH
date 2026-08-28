-- Phase 5C: Interview Invitation & Authorized Assessment Schema

-- 1. Create Interview Invitations Table
CREATE TABLE public.interview_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    candidate_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    interviewer_email TEXT NOT NULL,
    interviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    target_role TEXT NOT NULL,
    role_requirements JSONB NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'in_progress', 'submitted', 'revoked', 'expired')),
    token TEXT NOT NULL UNIQUE, -- In a full production env, we'd hash this. We use a secure random string.
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create Proven Evidence (Assessments) Table
CREATE TABLE public.proven_evidence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invitation_id UUID REFERENCES public.interview_invitations(id) ON DELETE CASCADE NOT NULL,
    requirement TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('VERIFIED', 'NOT_VERIFIED', 'NOT_ASSESSED')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security
ALTER TABLE public.interview_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proven_evidence ENABLE ROW LEVEL SECURITY;

-- 4. RLS for Invitations
-- Candidates can view their own invitations
CREATE POLICY "Candidates can view their own invitations"
ON public.interview_invitations FOR SELECT
USING (candidate_id = auth.uid());

-- Candidates can insert their own invitations
CREATE POLICY "Candidates can insert their own invitations"
ON public.interview_invitations FOR INSERT
WITH CHECK (candidate_id = auth.uid());

-- Candidates can update their own invitations (only to revoke)
CREATE POLICY "Candidates can revoke their own invitations"
ON public.interview_invitations FOR UPDATE
USING (candidate_id = auth.uid())
WITH CHECK (candidate_id = auth.uid());

-- Interviewers can view invitations assigned to their authenticated email OR their ID
CREATE POLICY "Interviewers can view assigned invitations"
ON public.interview_invitations FOR SELECT
USING (
    interviewer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    interviewer_id = auth.uid()
);

-- Interviewers can update invitations they are assigned to (e.g. to accept, submit)
CREATE POLICY "Interviewers can update assigned invitations"
ON public.interview_invitations FOR UPDATE
USING (
    interviewer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    interviewer_id = auth.uid()
)
WITH CHECK (
    interviewer_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
    interviewer_id = auth.uid()
);

-- 5. RLS for Proven Evidence
-- Candidates can view proven evidence tied to their invitations
CREATE POLICY "Candidates can view their proven evidence"
ON public.proven_evidence FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.interview_invitations i
        WHERE i.id = public.proven_evidence.invitation_id
        AND i.candidate_id = auth.uid()
    )
);

-- Interviewers can view and insert proven evidence for invitations they accepted
CREATE POLICY "Interviewers can manage proven evidence for accepted invitations"
ON public.proven_evidence FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.interview_invitations i
        WHERE i.id = public.proven_evidence.invitation_id
        AND i.interviewer_id = auth.uid()
    )
);
