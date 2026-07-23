import advancedRolesData from '@/data/roles-advanced.json';

export type RoleScore = {
  role: string;
  score: number;
  confidence: number;
  matchedKeywords: string[];
};

export type RoleDetectionResult = {
  primaryRole: RoleScore | null;
  secondaryRoles: RoleScore[];
};

// Hardcoded robust weighted dictionary to ensure accurate production-grade parsing
const ROLE_WEIGHTS = [
  {
    title: "UI/UX Designer",
    threshold: 15,
    weights: {
      "figma": 10, "adobe xd": 8, "user research": 10, "wireframe": 8, "wireframing": 8,
      "prototype": 8, "prototyping": 8, "design system": 10, "usability testing": 10,
      "maze": 5, "miro": 5, "framer": 8, "interaction design": 10, 
      "information architecture": 10, "user flow": 8, "journey map": 8,
      "sketch": 5, "invision": 5, "user experience": 10, "user interface": 10
    }
  },
  {
    title: "Frontend Developer",
    threshold: 15,
    weights: {
      "react": 10, "reactjs": 10, "next.js": 10, "nextjs": 10, "vue": 8, "vuejs": 8,
      "angular": 8, "javascript": 10, "typescript": 10, "html": 5, "css": 5,
      "tailwind": 8, "tailwindcss": 8, "sass": 5, "redux": 8, "zustand": 5,
      "webpack": 5, "frontend": 10, "ui development": 8
    }
  },
  {
    title: "Backend Developer",
    threshold: 15,
    weights: {
      "node.js": 10, "nodejs": 10, "express": 8, "nest": 8, "nestjs": 8, "python": 8,
      "django": 8, "flask": 5, "java": 8, "spring boot": 10, "golang": 10, "go": 8,
      "ruby on rails": 8, "postgresql": 10, "mongodb": 8, "mysql": 8, "redis": 8,
      "kafka": 10, "rabbitmq": 8, "docker": 8, "kubernetes": 10, "aws": 8, "backend": 10,
      "api development": 8, "microservices": 10
    }
  },
  {
    title: "Data Analyst",
    threshold: 15,
    weights: {
      "sql": 10, "excel": 8, "tableau": 10, "power bi": 10, "powerbi": 10,
      "python": 8, "r": 8, "pandas": 8, "numpy": 5, "data visualization": 10,
      "data cleaning": 8, "dashboard": 8, "google analytics": 8, "looker": 8,
      "data analysis": 10, "statistics": 8
    }
  },
  {
    title: "Data Scientist",
    threshold: 15,
    weights: {
      "machine learning": 10, "ml": 8, "deep learning": 10, "python": 8,
      "tensorflow": 10, "pytorch": 10, "scikit-learn": 8, "nlp": 10,
      "computer vision": 10, "data modeling": 8, "statistical modeling": 8,
      "data science": 10, "predictive modeling": 10
    }
  },
  {
    title: "DevOps Engineer",
    threshold: 15,
    weights: {
      "aws": 10, "azure": 8, "gcp": 8, "docker": 10, "kubernetes": 10,
      "k8s": 10, "terraform": 10, "ansible": 8, "jenkins": 10, "cicd": 10,
      "ci/cd": 10, "github actions": 8, "gitlab ci": 8, "linux": 8,
      "bash": 5, "shell scripting": 8, "devops": 10
    }
  }
];

export const RoleDetectionService = {
  detect(rawText: string): RoleDetectionResult {
    const normalizedText = rawText.toLowerCase();
    const roleScores: RoleScore[] = [];

    for (const roleDef of ROLE_WEIGHTS) {
      let currentScore = 0;
      let maxPossibleScore = 0;
      const matchedKeywords: Set<string> = new Set();

      for (const [term, weight] of Object.entries(roleDef.weights)) {
        maxPossibleScore += weight;
        
        // Word boundary match
        const termRegex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        
        if (termRegex.test(normalizedText)) {
          currentScore += weight;
          matchedKeywords.add(term);
        }
      }

      let confidence = 0;
      if (maxPossibleScore > 0) {
        // Since it's impossible for a resume to have ALL keywords, 
        // we scale confidence relative to a realistic "perfect" score for a resume.
        // Let's assume hitting ~50% of the max possible weight is a 100% confidence match.
        const realisticMax = maxPossibleScore * 0.5;
        confidence = Math.min(Math.round((currentScore / realisticMax) * 100), 99);
      }

      if (currentScore >= roleDef.threshold) {
        roleScores.push({
          role: roleDef.title,
          score: currentScore,
          confidence,
          matchedKeywords: Array.from(matchedKeywords)
        });
      }
    }

    // Sort by confidence, then score
    roleScores.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return b.score - a.score;
    });

    const primaryRole = roleScores.length > 0 ? roleScores[0] : null;
    const secondaryRoles = roleScores.length > 1 ? roleScores.slice(1, 3) : [];

    return {
      primaryRole,
      secondaryRoles
    };
  }
};
