import { createAdminClient } from "@/lib/supabase/admin"
import { AuthorizationService } from "./authorization-service"
import { UnifiedEvidenceService, UnifiedMatrixRow } from "./unified-evidence-service"
import { PublicEvidenceReport, PublicEvidenceMatrixRow } from "./public-evidence-service"

export type ApplicationSummary = {
  id: string;
  candidateLabel: string;
  targetRole: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationDetail = {
  id: string;
  targetRole: string;
  status: string;
  createdAt: string;
  evidence: PublicEvidenceReport;
}

export const ApplicationService = {
  /**
   * Safe list of organizations for candidates to apply to.
   */
  async getAvailableOrganizations() {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .order('name', { ascending: true })
    return data || []
  },

  /**
   * For the Candidate: List their own applications.
   */
  async getCandidateApplications(candidateId: string) {
    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from('candidate_applications')
      .select('id, target_role, status, created_at, updated_at, organizations ( name )')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false })
    
    return data || []
  },

  /**
   * For the Organization: List incoming applications.
   */
  async getOrganizationApplications(userId: string, orgId: string): Promise<ApplicationSummary[]> {
    const hasAccess = await AuthorizationService.verifyOrganizationAccess(userId, orgId, ['owner', 'admin'])
    if (!hasAccess) return []

    const supabaseAdmin = createAdminClient();
    const { data } = await supabaseAdmin
      .from('candidate_applications')
      .select('id, candidate_id, target_role, status, created_at, updated_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (!data) return []

    return data.map(app => ({
      id: app.id,
      candidateLabel: `Candidate ${app.candidate_id.substring(0, 6).toUpperCase()}`,
      targetRole: app.target_role,
      status: app.status,
      createdAt: app.created_at,
      updatedAt: app.updated_at
    }))
  },

  /**
   * For the Organization: View a specific application's evidence safely.
   */
  async getApplicationDetail(userId: string, applicationId: string): Promise<ApplicationDetail | null> {
    const supabaseAdmin = createAdminClient();
    
    // 1. Fetch App details
    const { data: app } = await supabaseAdmin
      .from('candidate_applications')
      .select('id, candidate_id, organization_id, target_role, status, created_at')
      .eq('id', applicationId)
      .single()

    if (!app) return null;

    // 2. Verify RBAC
    const hasAccess = await AuthorizationService.verifyOrganizationAccess(userId, app.organization_id, ['owner', 'admin'])
    if (!hasAccess) return null;

    // 3. Fetch Unified Evidence strictly scoped to the Application's snapshot role
    const rawReport = await UnifiedEvidenceService.getReport(app.candidate_id, app.target_role);

    // 4. Sanitize the payload into the secure Public DTO (omitting private comments/UUIDs)
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
        // Comments explicitly stripped
      }))
    }));

    return {
      id: app.id,
      targetRole: app.target_role,
      status: app.status,
      createdAt: app.created_at,
      evidence: {
        targetRole: app.target_role,
        preparationAlignment: rawReport.preparationAlignment,
        matrix: publicMatrix,
        totalAssessments: rawReport.totalAssessments
      }
    };
  }
}
