/** Client-side sample resume for template previews */
export const SAMPLE_RESUME = {
  title: 'Professional Resume',
  templateSlug: 'classic-blue',
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
    'Results-driven software engineer with 6+ years building scalable web applications. Expertise in React, Node.js, and cloud architecture.',
  experience: [
    {
      company: 'TechNova Solutions',
      position: 'Senior Software Engineer',
      location: 'Bangalore',
      startDate: '2021',
      endDate: '',
      current: true,
      description: 'Led migration to microservices.\nBuilt MERN SaaS platform serving 50k+ users.',
    },
    {
      company: 'Digital Craft Pvt Ltd',
      position: 'Full Stack Developer',
      location: 'Mumbai',
      startDate: '2018',
      endDate: '2021',
      current: false,
      description: 'Developed REST APIs and React dashboards for fintech clients.',
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
  ],
  projects: [
    {
      name: 'ResumeForge SaaS',
      url: '',
      technologies: 'React, Node.js',
      description: 'Freemium resume builder with professional templates.',
    },
  ],
  certifications: [
    { name: 'AWS Solutions Architect', issuer: 'AWS', date: '2023', url: '' },
  ],
  sectionOrder: [
    'personal', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications',
  ],
};

export const withTemplateSlug = (slug) => ({
  ...SAMPLE_RESUME,
  templateSlug: slug,
  theme: undefined,
});
