-- Phase 7D: Candidate Applications

BEGIN;

CREATE TABLE public.candidate_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization Indexes
CREATE INDEX idx_candidate_apps_candidate ON public.candidate_applications(candidate_id);
CREATE INDEX idx_candidate_apps_org ON public.candidate_applications(organization_id);
CREATE INDEX idx_candidate_apps_status ON public.candidate_applications(status);

-- Enable RLS
ALTER TABLE public.candidate_applications ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own applications
CREATE POLICY "Candidates can view own applications"
ON public.candidate_applications
FOR SELECT
USING (candidate_id = auth.uid());

-- Organization Owners and Admins can view applications submitted to their org
CREATE POLICY "Owners and admins can view organization applications"
ON public.candidate_applications
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members AS my_memberships
        WHERE my_memberships.organization_id = public.candidate_applications.organization_id
        AND my_memberships.user_id = auth.uid()
        AND my_memberships.role IN ('owner', 'admin')
    )
);

-- Mutations (Insert, Update) are explicitly handled via secure Server Actions
-- using the Admin Client to enforce strict state machine rules and deduplication.

COMMIT;
