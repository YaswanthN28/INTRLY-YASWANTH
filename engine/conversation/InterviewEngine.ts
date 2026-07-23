import { useState, useCallback } from 'react';

type InterviewPhase = 'greeting' | 'intro' | 'technical' | 'behavioral' | 'hr' | 'closing';

interface InterviewEngineState {
  phase: InterviewPhase;
  currentQuestionIndex: number;
  acknowledgments: string[];
}

export function useInterviewEngine(questions: any[]) {
  const [state, setState] = useState<InterviewEngineState>({
    phase: 'greeting',
    currentQuestionIndex: 0,
    acknowledgments: [
      "That's a good answer.",
      "Interesting.",
      "I understand.",
      "Thanks for explaining.",
      "Good.",
      "Excellent.",
      "Makes sense.",
      "Let's move to the next question."
    ]
  });

  const getAcknowledgment = useCallback(() => {
    // Pick a random acknowledgment from the list to avoid repetition
    const randomIndex = Math.floor(Math.random() * state.acknowledgments.length);
    return state.acknowledgments[randomIndex];
  }, [state.acknowledgments]);

  const advancePhase = useCallback(() => {
    setState((prev) => {
      let nextPhase = prev.phase;
      let nextIndex = prev.currentQuestionIndex;

      if (prev.phase === 'greeting') nextPhase = 'intro';
      else if (prev.phase === 'intro') {
        nextPhase = 'technical';
        nextIndex = 0;
      }
      else if (prev.phase === 'technical') {
        if (prev.currentQuestionIndex < questions.length - 1) {
          nextIndex = prev.currentQuestionIndex + 1;
        } else {
          nextPhase = 'behavioral';
          nextIndex = 0; // Assuming we would load behavioral questions here
        }
      }
      
      // Additional logic to transition through behavioral, hr, closing...

      return { ...prev, phase: nextPhase, currentQuestionIndex: nextIndex };
    });
  }, [questions.length]);

  return {
    phase: state.phase,
    currentQuestionIndex: state.currentQuestionIndex,
    getAcknowledgment,
    advancePhase
  };
}
