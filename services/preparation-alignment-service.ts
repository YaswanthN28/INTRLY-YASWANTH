import { createClient } from "@/lib/supabase/server";
import { ROLE_WEIGHTS } from "@/services/role-detection-service";
import { PracticeEvidenceService } from "@/services/practice-evidence-service";

export type EvidenceState = 'NO_EVIDENCE' | 'CLAIMED' | 'PRACTICED' | 'REPEATEDLY_PRACTICED';

export type RequirementAlignment = {
  concept: string;
  claimed: boolean;
  practiceMatchCount: number;
  practiceInterviewCount: number;
  lastDemonstratedAt: string | null;
  evidenceState: EvidenceState;
  scoreValue: number;
  explanation: string;
};

export type PreparationAlignmentResult = {
  targetRole: string;
  alignmentPercentage: number;
  totalRequirements: number;
  requirementsWithEvidence: number;
  requirements: RequirementAlignment[];
  legacyInterviewsCount: number;
  limitations: string[];
};

export const PreparationAlignmentService = {
  async calculateAlignment(userId: string, targetRole: string): Promise<PreparationAlignmentResult | null> {
    const supabase = await createClient();

    // 1. Role Requirements (Equal Weighting)
    const roleDef = ROLE_WEIGHTS.find(r => r.title === targetRole);
    if (!roleDef) return null;
    
    // We explicitly ignore the numeric weights in ROLE_WEIGHTS. They are for detection, not readiness.
    const expectedConcepts = Object.keys(roleDef.weights).map(k => k.toLowerCase());

    // 2. Claimed Evidence (Resume)
    const { data: resumes } = await supabase
      .from('resumes')
      .select('raw_json')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    const rawJson = resumes?.[0]?.raw_json || {};
    const claimedSkills = (rawJson.extractedSkills || []).map((s: string) => s.toLowerCase());

    // 3. Practiced Evidence (Target-Role Scoped)
    const aggregatedPractice = await PracticeEvidenceService.getAggregatedEvidence(userId, targetRole);
    const { evidenceMap, legacyInterviewsCount } = aggregatedPractice;

    // 4. Calculate Evidence States
    const requirements: RequirementAlignment[] = [];
    let totalScore = 0;
    let requirementsWithEvidence = 0;
    const MAX_SCORE_PER_CONCEPT = 3;

    for (const concept of expectedConcepts) {
      const isClaimed = claimedSkills.includes(concept);
      const practiceDepth = evidenceMap.get(concept);
      const interviewCount = practiceDepth?.interviewCount || 0;
      const matchCount = practiceDepth?.matchCount || 0;
      const lastDemonstratedAt = practiceDepth?.lastDemonstratedAt || null;

      let evidenceState: EvidenceState = 'NO_EVIDENCE';
      let scoreValue = 0;
      let explanation = 'Not detected in available evidence.';

      if (interviewCount >= 2) {
        evidenceState = 'REPEATEDLY_PRACTICED';
        scoreValue = 3;
        explanation = `Demonstrated across ${interviewCount} target-role practice sessions.`;
        if (isClaimed) explanation += ' Also detected in resume.';
      } else if (interviewCount === 1) {
        evidenceState = 'PRACTICED';
        scoreValue = 2;
        explanation = `Demonstrated in 1 target-role practice session (matched ${matchCount}x).`;
        if (isClaimed) explanation += ' Also detected in resume.';
      } else if (isClaimed) {
        evidenceState = 'CLAIMED';
        scoreValue = 1;
        explanation = 'Detected in your resume, but not yet demonstrated in target-role practice.';
      }

      if (scoreValue > 0) {
        requirementsWithEvidence++;
      }

      totalScore += scoreValue;

      requirements.push({
        concept,
        claimed: isClaimed,
        practiceMatchCount: matchCount,
        practiceInterviewCount: interviewCount,
        lastDemonstratedAt,
        evidenceState,
        scoreValue,
        explanation
      });
    }

    // 5. Compute Final Alignment Percentage
    const maxPossibleScore = expectedConcepts.length * MAX_SCORE_PER_CONCEPT;
    const alignmentPercentage = maxPossibleScore === 0 ? 0 : Math.round((totalScore / maxPossibleScore) * 100);

    return {
      targetRole,
      alignmentPercentage,
      totalRequirements: expectedConcepts.length,
      requirementsWithEvidence,
      requirements,
      legacyInterviewsCount,
      limitations: [
        "Preparation Alignment uses equal weighting for all concepts.",
        "The current role taxonomy does not distinguish between required and optional concepts.",
        "Practice evidence is bounded by Speech-to-Text accuracy.",
        "Historical interviews lacking a target role are intentionally excluded."
      ]
    };
  }
};
