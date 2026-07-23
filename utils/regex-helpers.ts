export const RegexHelpers = {
  extractEmail(text: string): string | null {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
  },

  extractPhone(text: string): string | null {
    const phoneRegex = /(\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;
    const matches = text.match(phoneRegex);
    // filter out matches that are just years or tiny numbers
    const validMatches = matches?.filter(m => m.replace(/\D/g, '').length >= 10);
    return validMatches && validMatches.length > 0 ? validMatches[0].trim() : null;
  },

  extractLinkedIn(text: string): string | null {
    const linkedInRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
    const matches = text.match(linkedInRegex);
    return matches ? matches[0] : null;
  },

  extractGitHub(text: string): string | null {
    const githubRegex = /(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/gi;
    const matches = text.match(githubRegex);
    return matches ? matches[0] : null;
  },

  extractPortfolio(text: string): string | null {
    // Find generic URLs that are not linkedin or github
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]*)?/gi;
    const matches = text.match(urlRegex);
    if (matches) {
      const filtered = matches.filter(url => !url.toLowerCase().includes('linkedin') && !url.toLowerCase().includes('github'));
      return filtered.length > 0 ? filtered[0] : null;
    }
    return null;
  },

  extractTotalExperience(text: string): number {
    // Looks for date ranges like: Jan 2022 - Present, 2018 to Dec 2023, 05/2021 - 09/2022
    const dateRangeRegex = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2}\/)?\s*(20\d{2}|19\d{2})\s*(?:-|to)\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[0-9]{1,2}\/)?\s*(20\d{2}|19\d{2}|Present|Current|Till Date|Now)/gi;
    
    // We will extract all valid ranges, convert them to month offsets from year 1900, 
    // merge overlapping intervals, and calculate total years.
    const intervals: [number, number][] = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentAbsoluteMonth = (currentYear - 1900) * 12 + currentMonth;

    let match;
    while ((match = dateRangeRegex.exec(text)) !== null) {
      const startYear = parseInt(match[1], 10);
      const endStr = match[2];
      
      let endYear = currentYear;
      if (endStr.match(/Present|Current|Till Date|Now/i)) {
        endYear = currentYear;
      } else {
        endYear = parseInt(endStr, 10);
      }

      // Basic sanity checks: don't count years in the future, or weird negative spans
      if (startYear > currentYear || endYear < startYear || (endYear - startYear) > 30) continue;

      // Approximate start/end months (assume Jan for start, Dec for end if not specified for simplicity, 
      // but keeping it conservative by just doing year diffs mapped to months)
      const startAbs = (startYear - 1900) * 12;
      let endAbs = (endYear - 1900) * 12 + 11; // assume end of year
      
      if (endYear === currentYear && endStr.match(/Present|Current|Till Date|Now/i)) {
        endAbs = currentAbsoluteMonth;
      }

      intervals.push([startAbs, endAbs]);
    }

    if (intervals.length === 0) return 0;

    // Merge overlapping intervals
    intervals.sort((a, b) => a[0] - b[0]);
    const merged: [number, number][] = [intervals[0]];

    for (let i = 1; i < intervals.length; i++) {
      const last = merged[merged.length - 1];
      const curr = intervals[i];
      if (curr[0] <= last[1]) {
        last[1] = Math.max(last[1], curr[1]);
      } else {
        merged.push(curr);
      }
    }

    let totalMonths = 0;
    for (const interval of merged) {
      totalMonths += (interval[1] - interval[0] + 1);
    }

    // Convert to years, rounded to 1 decimal place
    const totalYears = totalMonths / 12;
    return Math.round(totalYears * 10) / 10;
  }
};
