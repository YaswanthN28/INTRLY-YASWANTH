import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AuthorizationService } from "./authorization-service"

export type OrgAssessmentSummary = {
  id: string;
  candidateId: string; // Internal, should be obfuscated/mapped for UI if needed
  candidateLabel: string; // Safe UI display (e.g. "Candidate #1234")
  targetRole: string;
  status: string;
  interviewerEmail: string;
  createdAt: string;
  submittedAt: string | null;
}

export type OrgDashboardData = {
  organizationName: string;
  metrics: {
    total: number;
    pending: number;
    accepted: number;
    submitted: number;
  };
  recentAssessments: OrgAssessmentSummary[];
}

export const OrganizationDashboardService = {
  /**
   * Fetches the organization's assessment pipeline.
   * Strictly verifies authentication and authorization before using the admin client.
   */
  async getDashboardData(userId: string, organizationId: string): Promise<OrgDashboardData | null> {
    // 1. Verify Authentication & Authorization
    const hasAccess = await AuthorizationService.verifyOrganizationAccess(userId, organizationId, ['owner', 'admin']);
    if (!hasAccess) {
      console.warn(`Unauthorized dashboard access attempt by user ${userId} for org ${organizationId}`);
      return null;
    }

    const supabaseAdmin = createAdminClient();

    // 2. Fetch Organization Details
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();

    if (!org) return null;

    // 3. Fetch Organization-Scoped Pipeline Data
    const { data: invitations, error } = await supabaseAdmin
      .from('interview_invitations')
      .select('id, candidate_id, target_role, status, interviewer_email, created_at, completed_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error || !invitations) {
      return { organizationName: org.name, metrics: { total: 0, pending: 0, accepted: 0, submitted: 0 }, recentAssessments: [] };
    }

    // 4. Calculate Objective Metrics
    const metrics = {
      total: invitations.length,
      pending: invitations.filter(i => i.status === 'pending').length,
      accepted: invitations.filter(i => i.status === 'accepted').length,
      submitted: invitations.filter(i => i.status === 'submitted').length,
    };

    // 5. Build Safe DTO (Obfuscating Candidate UUIDs)
    const recentAssessments = invitations.map(inv => ({
      id: inv.id,
      candidateId: inv.candidate_id,
      // Create a privacy-safe label so employers can track candidates without exposing raw UUIDs publicly
      candidateLabel: `Candidate ${inv.candidate_id.substring(0, 6).toUpperCase()}`, 
      targetRole: inv.target_role,
      status: inv.status,
      interviewerEmail: inv.interviewer_email,
      createdAt: inv.created_at,
      submittedAt: inv.completed_at
    }));

    return {
      organizationName: org.name,
      metrics,
      recentAssessments
    };
  }
}
