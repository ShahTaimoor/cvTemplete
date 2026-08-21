export const getSampleResumePayload = (overrides = {}) => ({
  title: 'Professional Resume',
  personal: {
    fullName: 'Priya Sharma',
    jobTitle: 'Senior Software Engineer',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
    website: 'linkedin.com/in/priyasharma',
    linkedin: 'linkedin.com/in/priyasharma',
    photo: '',
  },
  summary:
    'Results-driven software engineer with 6+ years building scalable web applications. Expertise in React, Node.js, and cloud architecture. Passionate about clean code, mentoring teams, and delivering user-centric products.',
  experience: [
    {
      company: 'TechNova Solutions',
      position: 'Senior Software Engineer',
      location: 'Bangalore',
      startDate: '2021',
      endDate: '',
      current: true,
      description:
        'Led migration to microservices, reducing deployment time by 40%.\nBuilt MERN SaaS platform serving 50k+ users.\nMentored 4 junior developers.',
    },
    {
      company: 'Digital Craft Pvt Ltd',
      position: 'Full Stack Developer',
      location: 'Mumbai',
      startDate: '2018',
      endDate: '2021',
      current: false,
      description:
        'Developed REST APIs and React dashboards for fintech clients.\nImproved page load speed by 35% through optimization.',
    },
  ],
  education: [
    {
      institution: 'Indian Institute of Technology',
      degree: 'B.Tech',
      field: 'Computer Science',
      startDate: '2014',
      endDate: '2018',
      description: '',
    },
  ],
  skills: [
    { name: 'React', level: 'Expert' },
    { name: 'Node.js', level: 'Expert' },
    { name: 'MongoDB', level: 'Advanced' },
    { name: 'TypeScript', level: 'Advanced' },
    { name: 'AWS', level: 'Intermediate' },
  ],
  projects: [
    {
      name: 'ResumeForge SaaS',
      url: 'github.com/example/resume',
      technologies: 'React, Node.js, Puppeteer',
      description: 'Freemium resume builder with 50+ templates and PDF export.',
    },
  ],
  certifications: [
    {
      name: 'AWS Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2023',
      url: '',
    },
  ],
  ...overrides,
});

export const getSampleCoverLetterPayload = () => ({
  title: 'Cover Letter — Software Engineer',
  personal: {
    fullName: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91 98765 43210',
    location: 'Bangalore, India',
  },
  recipientName: 'Hiring Manager',
  recipientTitle: 'Talent Acquisition',
  companyName: 'TechNova Solutions',
  companyAddress: 'Bangalore, Karnataka',
  date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }),
  salutation: 'Dear Hiring Manager,',
  // Deliberately written as fill-in-the-blank starter text (bracketed
  // placeholders), not a fabricated-but-specific narrative — the personal
  // info above gets correctly overwritten with the linked resume's real
  // data on creation (see coverLetterRoutes.js), but this body doesn't, so
  // it must read as obviously unfinished rather than as someone else's
  // real, ready-to-send cover letter that just happens to still be here.
  body: `I am writing to express my interest in the [Job Title] position at [Company Name]. With my background in [your field or years of experience], I believe I would be a strong fit for this role and this team.

[Add a sentence or two here about a specific achievement, skill, or project that's relevant to this position.]

Thank you for considering my application. I look forward to the opportunity to discuss how my experience aligns with your needs.`,
  closing: 'Sincerely,',
});
