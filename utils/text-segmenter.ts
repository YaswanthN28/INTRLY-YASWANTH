export const TextSegmenter = {
  extractName(text: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (/^[A-Z][a-zA-Z-]+\s[A-Z][a-zA-Z-]+(\s[A-Z][a-zA-Z-]+)?$/.test(line)) {
        return line;
      }
    }
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i];
      if (/^[a-zA-Z\s-]{4,30}$/.test(line) && !line.toLowerCase().includes('resume') && !line.toLowerCase().includes('cv')) {
        return line;
      }
    }
    return null;
  },

  // Skill Normalization Dictionary
  normalizeSkill(skill: string): string {
    const s = skill.toLowerCase().trim();
    const map: Record<string, string> = {
      'reactjs': 'React', 'react.js': 'React', 'react': 'React',
      'next js': 'Next.js', 'nextjs': 'Next.js', 'next.js': 'Next.js',
      'node js': 'Node.js', 'nodejs': 'Node.js', 'node.js': 'Node.js',
      'javascript': 'JavaScript', 'js': 'JavaScript',
      'typescript': 'TypeScript', 'ts': 'TypeScript',
      'vuejs': 'Vue', 'vue.js': 'Vue', 'vue': 'Vue',
      'angularjs': 'Angular', 'angular': 'Angular',
      'aws': 'AWS', 'amazon web services': 'AWS',
      'gcp': 'GCP', 'google cloud': 'GCP',
      'css3': 'CSS', 'css': 'CSS',
      'html5': 'HTML', 'html': 'HTML'
    };
    return map[s] || skill; // Return properly cased if in map, else original
  },

  extractSkills(text: string, knownSkills: string[]): string[] {
    const extracted = new Set<string>();
    const lowerText = text.toLowerCase();
    
    for (const skill of knownSkills) {
      if (skill.length <= 2 || skill.toLowerCase() === 'c#') {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(text)) {
          extracted.add(this.normalizeSkill(skill));
        }
      } else {
        if (lowerText.includes(skill.toLowerCase())) {
          extracted.add(this.normalizeSkill(skill));
        }
      }
    }
    return Array.from(extracted);
  },

  extractSection(text: string, sectionKeywords: string[]): string {
    const lines = text.split('\n');
    let sectionText = '';
    let inSection = false;

    // A generic header regex to detect when a section ends and a new one begins
    const headerRegex = /^(EXPERIENCE|EMPLOYMENT|WORK HISTORY|PROJECTS|EDUCATION|SKILLS|CERTIFICATIONS|TECHNOLOGIES)\b/i;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isTargetHeader = sectionKeywords.some(k => new RegExp(`^${k}\\b`, 'i').test(trimmed));
      const isAnyHeader = headerRegex.test(trimmed);

      if (isTargetHeader && !inSection) {
        inSection = true;
        continue; // Skip the header itself
      } else if (inSection && isAnyHeader) {
        break; // Reached the next section
      }

      if (inSection) {
        sectionText += line + '\n';
      }
    }

    return sectionText.trim();
  }
};
