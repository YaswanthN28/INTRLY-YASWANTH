-- Phase 5F: RLS Security Hardening

-- RATIONALE:
-- Direct database access via the authenticated Supabase client allowed malicious candidates 
-- or interviewers to arbitrarily update rows, potentially forging requirement snapshots or 
-- mutating evidence post-submission.
-- We are shifting the responsibility for INSERT/UPDATE/DELETE mutations entirely to the 
-- Server Actions (which now use the service_role client) to enforce strict state machine rules, 
-- while leaving SELECT policies in place so the UI can still read data via RLS safely.

BEGIN;

-- 1. Lock down Interview Invitations mutations
DROP POLICY IF EXISTS "Candidates can insert their own invitations" ON public.interview_invitations;
DROP POLICY IF EXISTS "Candidates can revoke their own invitations" ON public.interview_invitations;
DROP POLICY IF EXISTS "Interviewers can update assigned invitations" ON public.interview_invitations;

-- (The existing SELECT policies remain active for both candidates and interviewers)


-- 2. Lock down Proven Evidence mutations
-- We drop the 'FOR ALL' policy for interviewers. They must not be able to UPDATE or DELETE evidence.
DROP POLICY IF EXISTS "Interviewers can manage proven evidence for accepted invitations" ON public.proven_evidence;

-- We recreate a SELECT-only policy for interviewers so they can view the evidence they submitted 
-- in the read-only portal view.
CREATE POLICY "Interviewers can view proven evidence for accepted invitations"
ON public.proven_evidence FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.interview_invitations i
        WHERE i.id = public.proven_evidence.invitation_id
        AND i.interviewer_id = auth.uid()
    )
);

-- (The existing SELECT policy for candidates remains active)

COMMIT;
