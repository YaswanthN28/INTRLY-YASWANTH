import { createClient } from "@/lib/supabase/server";
import { EvaluationService, QuestionResult } from "./evaluation-service";
import { Question } from "./interview-generation-service";

export type PracticeEvidence = {
  concept: string;
  matchCount: number;
  interviewCount: number;
  questionCount: number;
  lastDemonstratedAt: string | null;
  interviewIds: Set<string>;
  questionResults: QuestionResult[];
};

export type AggregatedPractice = {
  evidenceMap: Map<string, PracticeEvidence>;
  totalTargetInterviews: number;
  legacyInterviewsCount: number;
};

export const PracticeEvidenceService = {
  async getAggregatedEvidence(userId: string, currentTargetRole?: string): Promise<AggregatedPractice> {
    const supabase = await createClient();

    // Fetch all interviews for the user (only what is strictly needed)
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('id, created_at, target_role, questions, transcripts')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const evidenceMap = new Map<string, PracticeEvidence>();
    let totalTargetInterviews = 0;
    let legacyInterviewsCount = 0;

    if (error || !interviews) {
      return { evidenceMap, totalTargetInterviews, legacyInterviewsCount };
    }

    // Sort interviews so oldest is first, ensuring lastDemonstratedAt gets the newest date if overwritten, 
    // or we can just iterate newest first and only set lastDemonstratedAt once.
    // The query is ordered by created_at DESC (newest first).

    for (const interview of interviews) {
      const isLegacy = interview.target_role == null;
      
      if (isLegacy) {
        legacyInterviewsCount++;
        // Legacy interviews without a target role cannot be safely attributed to the current target role
        continue;
      }

      if (currentTargetRole && interview.target_role !== currentTargetRole) {
        // Skip interviews that were generated for a different target role
        continue;
      }

      totalTargetInterviews++;

      // We only evaluate if questions and transcripts exist
      if (interview.questions && interview.transcripts) {
        const report = EvaluationService.evaluate(interview.questions, interview.transcripts);

        report.questionResults.forEach((qr) => {
          qr.matchedKeywords.forEach((kw) => {
            const concept = kw.toLowerCase();
            const existing = evidenceMap.get(concept) || {
              concept,
              matchCount: 0,
              interviewCount: 0,
              questionCount: 0,
              lastDemonstratedAt: null,
              interviewIds: new Set<string>(),
              questionResults: []
            };

            existing.matchCount++;
            existing.interviewIds.add(interview.id);
            existing.interviewCount = existing.interviewIds.size;
            existing.questionCount++; // 1 match = 1 question context in this loop
            existing.questionResults.push(qr);
            
            // Since interviews are DESC (newest first), the first time we see a concept, it is the most recent
            if (!existing.lastDemonstratedAt) {
              existing.lastDemonstratedAt = interview.created_at;
            }

            evidenceMap.set(concept, existing);
          });
        });
      }
    }

    return { evidenceMap, totalTargetInterviews, legacyInterviewsCount };
  }
};
