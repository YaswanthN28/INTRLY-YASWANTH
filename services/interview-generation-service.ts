import behavioralQs from '@/data/questions/behavioral.json';
import frontendQs from '@/data/questions/frontend.json';
import backendQs from '@/data/questions/backend.json';
import generalQs from '@/data/questions/general.json';

export type Question = {
  id: string;
  role: string[];
  category: string;
  experience_level: string[];
  difficulty: number;
  question: string;
  expected_keywords: string[];
  follow_up_questions: string[];
  score_weight: number;
};

export const InterviewGenerationService = {
  generate(primaryRole: string | null, totalExperienceYears: number, skills: string[]): Question[] {
    // 1. Determine Experience Level
    let experienceLevel = "Junior";
    if (totalExperienceYears >= 3 && totalExperienceYears <= 5) experienceLevel = "Mid";
    if (totalExperienceYears > 5) experienceLevel = "Senior";

    // 2. Aggregate Pool
    const allQuestions: Question[] = [
      ...behavioralQs,
      ...frontendQs,
      ...backendQs,
      ...generalQs
    ] as Question[];

    // 3. Filter by Experience Level
    const levelFiltered = allQuestions.filter(q => q.experience_level.includes(experienceLevel) || q.experience_level.includes("All"));

    // Helper: Fisher-Yates Shuffle
    const shuffle = (array: Question[]) => {
      let currentIndex = array.length, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
      }
      return array;
    };

    // 4. Segmentation
    const hrQuestions = shuffle(levelFiltered.filter(q => q.category === 'HR'));
    const behavioralQuestions = shuffle(levelFiltered.filter(q => ['Behavioral', 'Leadership', 'Communication'].includes(q.category)));
    
    // Technical questions matching the role or general
    const techQuestions = shuffle(levelFiltered.filter(q => 
      ['Technical', 'Problem Solving', 'Scenario Based'].includes(q.category) && 
      (primaryRole && q.role.includes(primaryRole) || q.role.includes('All'))
    ));

    // 5. Compose Interview (Target 10-12 questions)
    const selectedQuestions: Question[] = [];
    const usedIds = new Set<string>();

    const addQuestions = (pool: Question[], count: number) => {
      let added = 0;
      for (const q of pool) {
        if (!usedIds.has(q.id) && added < count) {
          selectedQuestions.push(q);
          usedIds.add(q.id);
          added++;
        }
      }
    };

    addQuestions(hrQuestions, 2);
    addQuestions(techQuestions, 5);
    addQuestions(behavioralQuestions, 3);

    // If we didn't hit 10, fill with any remaining tech/general questions
    if (selectedQuestions.length < 10) {
       addQuestions(techQuestions, 10 - selectedQuestions.length);
    }

    return selectedQuestions;
  }
};
