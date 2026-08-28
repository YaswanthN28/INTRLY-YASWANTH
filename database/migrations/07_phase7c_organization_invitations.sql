-- Phase 7C: Organization Member Invitations

BEGIN;

CREATE TABLE public.organization_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'interviewer' CHECK (role = 'interviewer'), -- Phase 7C explicitly restricts to interviewer
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization & Lookup Indexes
CREATE INDEX idx_org_invites_org_id ON public.organization_invitations(organization_id);
CREATE INDEX idx_org_invites_email ON public.organization_invitations(invited_email);
CREATE INDEX idx_org_invites_token_hash ON public.organization_invitations(token_hash);

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Select Policy: Organization Owners and Admins can view invitations for their organization
CREATE POLICY "Owners and admins can view organization invitations"
ON public.organization_invitations
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members AS my_memberships
        WHERE my_memberships.organization_id = public.organization_invitations.organization_id
        AND my_memberships.user_id = auth.uid()
        AND my_memberships.role IN ('owner', 'admin')
    )
);

-- Note: INSERT, UPDATE, and DELETE are strictly controlled via Server Actions 
-- utilizing the admin client to ensure rigorous validation of roles, duplicate prevention, 
-- and cryptographic token hashing.

COMMIT;
