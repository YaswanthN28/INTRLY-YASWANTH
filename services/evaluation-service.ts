import { Question } from "./interview-generation-service";

export type QuestionResult = {
  question: Question;
  transcript: string;
  score: number; // 0-100
  matchedKeywords: string[];
  missedKeywords: string[];
};

export type InterviewReport = {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  confidenceScore: number;
  roleReadiness: number;
  questionResults: QuestionResult[];
  strengths: string[];
  weaknesses: string[];
  radarData: { subject: string; A: number; fullMark: number }[];
  timelineData: { name: string; score: number }[];
};

export const EvaluationService = {
  evaluate(questions: Question[], transcripts: Record<string, string>): InterviewReport {
    const questionResults: QuestionResult[] = [];
    
    let totalScore = 0;
    let techScoreTotal = 0;
    let techMax = 0;
    
    let commScoreTotal = 0;
    let confScoreTotal = 0;
    
    const categoryScores: Record<string, { earned: number, max: number }> = {};
    const strengthsSet = new Set<string>();
    const weaknessesSet = new Set<string>();

    questions.forEach((q, index) => {
      const transcript = transcripts[q.id] || "";
      const lowerTranscript = transcript.toLowerCase();
      
      const matched: string[] = [];
      const missed: string[] = [];
      
      q.expected_keywords.forEach(kw => {
        // Simple heuristic word boundary match
        const regex = new RegExp(`\\b${kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        if (regex.test(lowerTranscript)) {
          matched.push(kw);
        } else {
          missed.push(kw);
        }
      });

      // Calculate score for this question (0-100 based on keyword match percentage)
      // We assume hitting 75% of keywords is a "perfect" 100 to allow some flexibility.
      let matchRatio = q.expected_keywords.length > 0 ? (matched.length / q.expected_keywords.length) : 1;
      let qScore = Math.min(Math.round(matchRatio * 1.33 * 100), 100); 

      // Communication & Confidence heuristic
      const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;
      const fillerWords = (lowerTranscript.match(/\b(um|uh|like|you know|sort of)\b/g) || []).length;
      
      // Basic heuristic: Good response is ~30+ words. Too many fillers hurts confidence.
      let qComm = Math.min(Math.round((wordCount / 40) * 100), 100);
      let qConf = Math.max(100 - (fillerWords * 10), 0);
      
      if (wordCount < 10) {
        qScore = Math.min(qScore, 20); // Severely penalize very short answers even if they hit a keyword
        qComm = 20;
        qConf = 40;
      }

      commScoreTotal += qComm;
      confScoreTotal += qConf;

      // Track by category
      const cat = q.category;
      if (!categoryScores[cat]) categoryScores[cat] = { earned: 0, max: 0 };
      categoryScores[cat].earned += qScore;
      categoryScores[cat].max += 100;

      if (['Technical', 'Problem Solving'].includes(cat)) {
        techScoreTotal += qScore;
        techMax += 100;
      }

      if (qScore > 80) strengthsSet.add(cat);
      if (qScore < 40) weaknessesSet.add(cat);

      totalScore += qScore;

      questionResults.push({
        question: q,
        transcript,
        score: qScore,
        matchedKeywords: matched,
        missedKeywords: missed
      });
    });

    const numQs = questions.length || 1;
    const overallScore = Math.round(totalScore / numQs);
    const technicalScore = techMax > 0 ? Math.round((techScoreTotal / techMax) * 100) : overallScore;
    const communicationScore = Math.round(commScoreTotal / numQs);
    const confidenceScore = Math.round(confScoreTotal / numQs);
    
    // Role Readiness is a weighted average favoring Technical (60%), Overall (20%), Confidence (20%)
    const roleReadiness = Math.round((technicalScore * 0.6) + (overallScore * 0.2) + (confidenceScore * 0.2));

    // Radar Data
    const radarData = Object.entries(categoryScores).map(([subject, data]) => ({
      subject,
      A: Math.round((data.earned / data.max) * 100),
      fullMark: 100
    }));

    // Timeline Data
    const timelineData = questionResults.map((qr, i) => ({
      name: `Q${i + 1}`,
      score: qr.score
    }));

    // If strengths/weaknesses are empty, add generics based on total
    if (strengthsSet.size === 0) strengthsSet.add(overallScore > 70 ? "General Competency" : "Requires further evaluation");
    if (weaknessesSet.size === 0) weaknessesSet.add(overallScore < 70 ? "Depth of knowledge" : "None significant detected");

    return {
      overallScore,
      technicalScore,
      communicationScore,
      confidenceScore,
      roleReadiness,
      questionResults,
      strengths: Array.from(strengthsSet),
      weaknesses: Array.from(weaknessesSet),
      radarData,
      timelineData
    };
  }
};
