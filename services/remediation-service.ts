import { UnifiedEvidenceService } from "./unified-evidence-service"

export type RemediationRecommendation = {
  requirement: string;
  targetRole: string;
  reason: string;
  recommendation: string;
  status: 'ACTIVE' | 'COMPLETED'; // Derived dynamically
};

export const RemediationService = {
  /**
   * Dynamically determines actionable feedback based on proven assessments.
   * If a requirement has a NOT_VERIFIED assessment and NO VERIFIED assessments,
   * it is returned as an active remediation opportunity.
   */
  async getRecommendations(candidateId: string, targetRole: string): Promise<RemediationRecommendation[]> {
    const report = await UnifiedEvidenceService.getReport(candidateId, targetRole);
    
    const recommendations: RemediationRecommendation[] = [];

    for (const row of report.matrix) {
      const hasVerified = row.provenAssessments.some(a => a.status === 'VERIFIED');
      const hasNotVerified = row.provenAssessments.some(a => a.status === 'NOT_VERIFIED');

      if (!hasVerified && hasNotVerified) {
        recommendations.push({
          requirement: row.concept,
          targetRole: targetRole,
          reason: "Not verified in your latest assessment.",
          recommendation: "A focused practice session may help you demonstrate this requirement more confidently in a future assessment.",
          status: 'ACTIVE'
        });
      }
    }

    return recommendations;
  }
}
