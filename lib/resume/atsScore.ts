/**
 * ATS Scoring Service
 * 
 * Analyzes LaTeX resume code to calculate an ATS Compatibility Score.
 * Prioritizes standard sections, readable typography, and machine-readable text.
 */
export async function analyzeAtsScore(latexCode: string) {
  const code = latexCode.toLowerCase()
  let score = 100
  const checks = []

  // Check 1: Standard Document Class
  if (/\\documentclass(\s*\[.*?\])?\s*\{(article|extarticle|resume|cv)\}/.test(code)) {
    checks.push({ name: "Standard document class", passed: true })
  } else {
    checks.push({ name: "Standard document class", passed: false })
    score -= 5
  }

  // Check 2: Experience Section
  if (code.includes("experience") || code.includes("employment") || code.includes("work history")) {
    checks.push({ name: "Experience section", passed: true })
  } else {
    checks.push({ name: "Experience section", passed: false })
    score -= 15
  }

  // Check 3: Education Section
  if (code.includes("education") || code.includes("university") || code.includes("college")) {
    checks.push({ name: "Education section", passed: true })
  } else {
    checks.push({ name: "Education section", passed: false })
    score -= 15
  }

  // Check 4: Contact Information (Simple proxy check for email/phone)
  if (code.includes("@") || code.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) {
    checks.push({ name: "Contact information", passed: true })
  } else {
    checks.push({ name: "Contact information", passed: false })
    score -= 10
  }

  // Check 5: Formatting Consistency (Penalty for overly complex layouts like minipages or multicol)
  if (code.includes("\\begin{minipage}") || code.includes("\\begin{multicols}")) {
    checks.push({ name: "Simple layout structure", passed: false })
    score -= 10
  } else {
    checks.push({ name: "Simple layout structure", passed: true })
  }

  return {
    score: Math.max(0, score),
    checks
  }
}
