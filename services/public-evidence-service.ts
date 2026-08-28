import { createAdminClient } from "@/lib/supabase/admin"
import crypto from "crypto"
import { UnifiedEvidenceService, UnifiedMatrixRow, UnifiedEvidenceReportData } from "./unified-evidence-service"
import { PreparationAlignmentResult } from "./preparation-alignment-service"

export type PublicProvenAssessment = {
  status: 'VERIFIED' | 'NOT_VERIFIED' | 'NOT_ASSESSED';
  organizationName: string | null;
  interviewerLabel: string;
  submittedAt: string;
  // Comments intentionally omitted for public privacy
};

export type PublicEvidenceMatrixRow = {
  concept: string;
  claimed: boolean;
  practiceMatchCount: number;
  practiceInterviewCount: number;
  lastPracticedAt: string | null;
  provenAssessments: PublicProvenAssessment[];
};

export type PublicEvidenceReport = {
  targetRole: string;
  preparationAlignment: PreparationAlignmentResult | null;
  matrix: PublicEvidenceMatrixRow[];
  totalAssessments: number;
  // Internal candidateId omitted
};

export const PublicEvidenceService = {
  async getSharedReport(rawToken: string): Promise<PublicEvidenceReport | null> {
    if (!rawToken || typeof rawToken !== 'string') return null;

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const supabaseAdmin = createAdminClient();

    // 1. Fetch and Validate Share Token
    const { data: share, error } = await supabaseAdmin
      .from('evidence_shares')
      .select('candidate_id, target_role, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !share) return null;

    // Validate Revocation and Expiration
    if (share.revoked_at) return null;
    if (share.expires_at && new Date(share.expires_at) <= new Date()) return null;

    // 2. Fetch the Unified Dossier (scoped to the snapshot target_role)
    const rawReport = await UnifiedEvidenceService.getReport(share.candidate_id, share.target_role);

    // 3. Build the Public-Safe DTO (Stripping Private Data)
    const publicMatrix: PublicEvidenceMatrixRow[] = rawReport.matrix.map((row: UnifiedMatrixRow) => ({
      concept: row.concept,
      claimed: row.claimed,
      practiceMatchCount: row.practiceMatchCount,
      practiceInterviewCount: row.practiceInterviewCount,
      lastPracticedAt: row.lastPracticedAt,
      provenAssessments: row.provenAssessments.map(a => ({
        status: a.status,
        organizationName: a.organizationName || null,
        interviewerLabel: a.interviewerLabel || 'Authorized Interviewer',
        submittedAt: a.submittedAt
        // Explicitly ignoring `a.comments`
      }))
    }));

    return {
      targetRole: share.target_role,
      preparationAlignment: rawReport.preparationAlignment,
      matrix: publicMatrix,
      totalAssessments: rawReport.totalAssessments
    };
  }
};
