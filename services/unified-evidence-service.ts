import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { PreparationAlignmentService, PreparationAlignmentResult } from "./preparation-alignment-service"

export type ProvenAssessmentResult = {
  status: 'VERIFIED' | 'NOT_VERIFIED' | 'NOT_ASSESSED';
  organizationName?: string;
  interviewerLabel?: string;
  submittedAt: string;
  comments?: string;
};

export type UnifiedMatrixRow = {
  concept: string;
  claimed: boolean;
  practiceMatchCount: number;
  practiceInterviewCount: number;
  lastPracticedAt: string | null;
  provenAssessments: ProvenAssessmentResult[];
};

export type UnifiedEvidenceReportData = {
  candidateId: string;
  targetRole: string;
  preparationAlignment: PreparationAlignmentResult | null;
  matrix: UnifiedMatrixRow[];
  totalAssessments: number;
  historicalWarnings: string[];
};

export const UnifiedEvidenceService = {
  async getReport(userId: string, targetRole: string): Promise<UnifiedEvidenceReportData> {
    const supabase = await createClient();

    // 1. Fetch Preparation Alignment (which handles Claimed Resume + Practiced STT Evidence)
    const preparationAlignment = await PreparationAlignmentService.calculateAlignment(userId, targetRole);

    const historicalWarnings: string[] = [];
    if (preparationAlignment && preparationAlignment.legacyInterviewsCount > 0) {
      historicalWarnings.push("Some older practice sessions do not contain a recorded Target Role. They are excluded from this role-specific evidence report to prevent incorrect attribution.");
    }

    // 2. Fetch Proven Evidence (Human verified assessments) for the specific Target Role
    // We use the admin client safely here because the user is already authenticated server-side.
    // This allows the join on `organizations` to bypass RLS, ensuring the candidate can see the name 
    // of the organization that assessed them, without weakening global RLS policies.
    // The query is strictly scoped to the authenticated candidate via `.eq('candidate_id', userId)`.
    const supabaseAdmin = createAdminClient();
    const { data: invitations, error } = await supabaseAdmin
      .from('interview_invitations')
      .select(`
        id, 
        interviewer_email,
        completed_at,
        organizations ( name ),
        proven_evidence ( requirement, status, comments )
      `)
      .eq('candidate_id', userId)
      .eq('target_role', targetRole)
      .eq('status', 'submitted')
      .order('completed_at', { ascending: false });

    const totalAssessments = invitations ? invitations.length : 0;
    
    // Group proven evidence by requirement concept
    const provenMap = new Map<string, ProvenAssessmentResult[]>();

    if (invitations && !error) {
      invitations.forEach((inv: any) => {
        const orgName = inv.organizations?.name;
        // Obfuscate the email slightly for privacy, showing just domain or partial
        const emailParts = inv.interviewer_email.split('@');
        const interviewerLabel = emailParts.length === 2 
          ? `***@${emailParts[1]}` // Hide username, show domain to candidate
          : 'Authorized Interviewer';

        if (Array.isArray(inv.proven_evidence)) {
          inv.proven_evidence.forEach((ev: any) => {
            const concept = ev.requirement.toLowerCase();
            const existing = provenMap.get(concept) || [];
            
            existing.push({
              status: ev.status,
              organizationName: orgName,
              interviewerLabel,
              submittedAt: inv.completed_at,
              comments: ev.comments
            });

            provenMap.set(concept, existing);
          });
        }
      });
    }

    // 3. Build the Unified Matrix
    const matrix: UnifiedMatrixRow[] = [];
    
    if (preparationAlignment) {
      preparationAlignment.requirements.forEach(req => {
        const concept = req.concept.toLowerCase();
        
        matrix.push({
          concept: req.concept,
          claimed: req.claimed,
          practiceMatchCount: req.practiceMatchCount,
          practiceInterviewCount: req.practiceInterviewCount,
          lastPracticedAt: req.lastDemonstratedAt,
          provenAssessments: provenMap.get(concept) || []
        });
      });
    }

    return {
      candidateId: userId,
      targetRole,
      preparationAlignment,
      matrix,
      totalAssessments,
      historicalWarnings
    };
  }
};
