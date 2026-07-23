import { RegexHelpers } from '@/utils/regex-helpers';
import { TextSegmenter } from '@/utils/text-segmenter';
import { RoleDetectionService, RoleDetectionResult } from '@/services/role-detection-service';
import skillsData from '@/data/skills.json';

export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  linkedIn: string | null;
  github: string | null;
  portfolio: string | null;
  totalExperienceYears: number;
  extractedSkills: string[];
  detectedRole: string | null;
  roleDetails: RoleDetectionResult;
  educationSection: string | null;
  experienceSection: string | null;
  projectsSection: string | null;
  certificationsSection: string | null;
  rawText: string;
};

export const ParsingService = {
  parseText(rawText: string): ParsedResume {
    const cleanText = rawText.replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n');
    
    // Extract Contact Info
    const email = RegexHelpers.extractEmail(cleanText);
    const phone = RegexHelpers.extractPhone(cleanText);
    const linkedIn = RegexHelpers.extractLinkedIn(cleanText);
    const github = RegexHelpers.extractGitHub(cleanText);
    const portfolio = RegexHelpers.extractPortfolio(cleanText);
    
    // Extract Name
    const name = TextSegmenter.extractName(cleanText);
    
    // Extract Advanced Sections using specific segmenter
    const experienceSection = TextSegmenter.extractSection(cleanText, ['EXPERIENCE', 'EMPLOYMENT', 'WORK HISTORY']);
    const projectsSection = TextSegmenter.extractSection(cleanText, ['PROJECTS', 'PERSONAL PROJECTS']);
    const educationSection = TextSegmenter.extractSection(cleanText, ['EDUCATION', 'ACADEMIC']);
    const certificationsSection = TextSegmenter.extractSection(cleanText, ['CERTIFICATIONS', 'LICENSES']);

    // Extract accurate math-based experience using the whole document (and explicitly checking experience block)
    const expText = experienceSection || cleanText;
    const totalExperienceYears = RegexHelpers.extractTotalExperience(expText);
    
    // Extract normalized skills
    // We pass the raw document and our extensive skills JSON dictionary
    const extractedSkills = TextSegmenter.extractSkills(cleanText, skillsData as string[]);
    
    // Use the new advanced Weighted Role Engine for precision matching
    const roleDetails = RoleDetectionService.detect(cleanText);
    const detectedRole = roleDetails.primaryRole ? roleDetails.primaryRole.role : null;
    
    return {
      name,
      email,
      phone,
      linkedIn,
      github,
      portfolio,
      totalExperienceYears,
      extractedSkills,
      detectedRole,
      roleDetails,
      educationSection,
      experienceSection,
      projectsSection,
      certificationsSection,
      rawText: cleanText
    };
  }
};
