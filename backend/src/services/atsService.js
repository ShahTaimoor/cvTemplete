const ACTION_VERBS = [
  'achieved', 'built', 'created', 'delivered', 'developed', 'implemented',
  'improved', 'increased', 'led', 'managed', 'optimized', 'reduced',
  'designed', 'launched', 'spearheaded', 'streamlined',
];

export const analyzeResume = (resume) => {
  const issues = [];
  const tips = [];
  let score = 100;

  const { personal, summary, experience, skills, education } = resume;

  if (!personal?.fullName) {
    issues.push('Missing full name');
    score -= 10;
  }
  if (!personal?.email) {
    issues.push('Missing email');
    score -= 5;
  }
  if (!personal?.phone) {
    issues.push('Missing phone number');
    score -= 5;
  }
  if (!summary || summary.length < 50) {
    issues.push('Professional summary is too short (aim for 50+ characters)');
    score -= 10;
  }
  if (!experience?.length) {
    issues.push('Add at least one work experience');
    score -= 15;
  }
  if (!skills?.length) {
    issues.push('Add relevant skills');
    score -= 10;
  }
  if (!education?.length) {
    issues.push('Add education history');
    score -= 5;
  }

  const allText = [
    summary,
    ...(experience || []).map((e) => e.description),
    ...(resume.projects || []).map((p) => p.description),
  ]
    .join(' ')
    .toLowerCase();

  const hasActionVerbs = ACTION_VERBS.some((v) => allText.includes(v));
  if (!hasActionVerbs && experience?.length) {
    tips.push('Use strong action verbs (e.g. developed, led, improved)');
    score -= 5;
  }

  if (summary && summary.length > 600) {
    tips.push('Keep summary concise (under 600 characters)');
    score -= 5;
  }

  const skillCount = skills?.filter((s) => s.name)?.length || 0;
  if (skillCount > 25) {
    tips.push('Too many skills listed — focus on 8–15 relevant ones');
    score -= 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    grade:
      score >= 85 ? 'Excellent' : score >= 70 ? 'Good' : score >= 50 ? 'Fair' : 'Needs Work',
    issues,
    tips,
    atsFriendly: score >= 70 && issues.length <= 2,
  };
};
