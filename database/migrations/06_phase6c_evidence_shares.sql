-- Phase 6C: Secure Evidence Dossier Sharing

BEGIN;

CREATE TABLE public.evidence_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recommended Indexes for performance and token lookups
CREATE INDEX idx_evidence_shares_token_hash ON public.evidence_shares(token_hash);
CREATE INDEX idx_evidence_shares_candidate_role ON public.evidence_shares(candidate_id, target_role);
CREATE INDEX idx_evidence_shares_expires_at ON public.evidence_shares(expires_at);

-- Enable RLS
ALTER TABLE public.evidence_shares ENABLE ROW LEVEL SECURITY;

-- Candidates can view their own share records (e.g., to see active shares and revoke them)
CREATE POLICY "Candidates can view own shares" 
ON public.evidence_shares 
FOR SELECT 
USING (auth.uid() = candidate_id);

-- Note: INSERT, UPDATE, and DELETE are intentionally omitted. 
-- Mutations (creating and revoking shares) will be handled strictly through Server Actions 
-- utilizing the admin client to enforce business rules, expiration logic, and hashing.

COMMIT;
