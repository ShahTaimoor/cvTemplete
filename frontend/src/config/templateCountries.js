/** Regional section labels & CV conventions per market */
export const SECTION_LABELS_BY_REGION = {
  us: { summary: 'Professional Summary', experience: 'Work Experience', education: 'Education', skills: 'Core Competencies', projects: 'Key Projects', certifications: 'Certifications', docTitle: 'RESUME' },
  uk: { summary: 'Personal Profile', experience: 'Employment History', education: 'Education & Qualifications', skills: 'Key Skills', projects: 'Projects', certifications: 'Professional Memberships', docTitle: 'CURRICULUM VITAE' },
  eu: { summary: 'Personal Statement', experience: 'Professional Experience', education: 'Education & Training', skills: 'Skills', projects: 'Projects', certifications: 'Certificates', docTitle: 'EUROPEAN CV' },
  de: { summary: 'Profil', experience: 'Berufserfahrung', education: 'Ausbildung', skills: 'Kenntnisse', projects: 'Projekte', certifications: 'Zertifikate', docTitle: 'LEBENSLAUF' },
  fr: { summary: 'Profil', experience: 'Expérience Professionnelle', education: 'Formation', skills: 'Compétences', projects: 'Projets', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  pk: { summary: 'Career Objective', experience: 'Work Experience', education: 'Academic Qualifications', skills: 'Technical Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  sa: { summary: 'Professional Profile', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Licenses & Certifications', docTitle: 'CURRICULUM VITAE' },
  ae: { summary: 'Profile Summary', experience: 'Professional Experience', education: 'Education', skills: 'Core Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  in: { summary: 'Career Objective', experience: 'Professional Experience', education: 'Academic Background', skills: 'Technical Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'RESUME' },
  ca: { summary: 'Professional Summary', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'RÉSUMÉ / RESUME' },
  au: { summary: 'Career Profile', experience: 'Employment History', education: 'Education', skills: 'Skills & Abilities', projects: 'Projects', certifications: 'Licences & Certifications', docTitle: 'CURRICULUM VITAE' },
  jp: { summary: 'Summary', experience: 'Work History', education: 'Academic Background', skills: 'Skills', projects: 'Projects', certifications: 'Qualifications', docTitle: '履歴書 STYLE CV' },
  ng: { summary: 'Personal Statement', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  br: { summary: 'Resumo Profissional', experience: 'Experiência Profissional', education: 'Formação Acadêmica', skills: 'Habilidades', projects: 'Projetos', certifications: 'Certificações', docTitle: 'CURRÍCULO' },
  za: { summary: 'Personal Profile', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  my: { summary: 'Career Objective', experience: 'Working Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  sg: { summary: 'Professional Summary', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  eg: { summary: 'Career Objective', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  bd: { summary: 'Career Objective', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  tr: { summary: 'Özet', experience: 'İş Deneyimi', education: 'Eğitim', skills: 'Yetenekler', projects: 'Projeler', certifications: 'Sertifikalar', docTitle: 'ÖZGEÇMİŞ' },
  mx: { summary: 'Resumen Profesional', experience: 'Experiencia Laboral', education: 'Educación', skills: 'Habilidades', projects: 'Proyectos', certifications: 'Certificaciones', docTitle: 'CURRÍCULUM VITAE' },
  ph: { summary: 'Career Objective', experience: 'Work Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  id: { summary: 'Profil', experience: 'Pengalaman Kerja', education: 'Pendidikan', skills: 'Keahlian', projects: 'Proyek', certifications: 'Sertifikasi', docTitle: 'CURRICULUM VITAE' },
  kr: { summary: 'Summary', experience: 'Career History', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'RESUME' },
  it: { summary: 'Profilo', experience: 'Esperienza Lavorativa', education: 'Istruzione', skills: 'Competenze', projects: 'Progetti', certifications: 'Certificazioni', docTitle: 'CURRICULUM VITAE' },
  es: { summary: 'Perfil Profesional', experience: 'Experiencia Laboral', education: 'Formación', skills: 'Habilidades', projects: 'Proyectos', certifications: 'Certificaciones', docTitle: 'CURRICULUM VITAE' },
  nl: { summary: 'Profiel', experience: 'Werkervaring', education: 'Opleiding', skills: 'Vaardigheden', projects: 'Projecten', certifications: 'Certificaten', docTitle: 'CURRICULUM VITAE' },
  qa: { summary: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
  kw: { summary: 'Profile', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', certifications: 'Certifications', docTitle: 'CURRICULUM VITAE' },
};

/** Country → layout type, region group, photo norm */
export const COUNTRY_CV_CONFIG = [
  { code: 'us', label: 'United States', flag: '🇺🇸', region: 'americas', layout: 'us-resume', showPhoto: false, styleNames: ['ATS Professional', 'Modern Resume', 'Executive'] },
  { code: 'uk', label: 'United Kingdom', flag: '🇬🇧', region: 'europe', layout: 'uk-cv', showPhoto: false, styleNames: ['Classic CV', 'Modern CV', 'Professional'] },
  { code: 'de', label: 'Germany', flag: '🇩🇪', region: 'europe', layout: 'de-cv', showPhoto: true, styleNames: ['Lebenslauf Classic', 'Modern', 'Professional'] },
  { code: 'fr', label: 'France', flag: '🇫🇷', region: 'europe', layout: 'fr-cv', showPhoto: true, styleNames: ['CV Classique', 'Moderne', 'Élégant'] },
  { code: 'it', label: 'Italy', flag: '🇮🇹', region: 'europe', layout: 'eu-cv', showPhoto: true, styleNames: ['CV Classico', 'Moderno', 'Professionale'] },
  { code: 'es', label: 'Spain', flag: '🇪🇸', region: 'europe', layout: 'eu-cv', showPhoto: true, styleNames: ['CV Clásico', 'Moderno', 'Profesional'] },
  { code: 'nl', label: 'Netherlands', flag: '🇳🇱', region: 'europe', layout: 'eu-cv', showPhoto: true, styleNames: ['Classic', 'Modern', 'Professional'] },
  { code: 'pk', label: 'Pakistan', flag: '🇵🇰', region: 'south-asia', layout: 'pk-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'sa', label: 'Saudi Arabia', flag: '🇸🇦', region: 'gulf', layout: 'sa-cv', showPhoto: true, styleNames: ['Formal CV', 'Executive', 'Modern Gulf'] },
  { code: 'ae', label: 'UAE', flag: '🇦🇪', region: 'gulf', layout: 'ae-cv', showPhoto: true, styleNames: ['Gulf Professional', 'Modern', 'Executive'] },
  { code: 'qa', label: 'Qatar', flag: '🇶🇦', region: 'gulf', layout: 'ae-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'kw', label: 'Kuwait', flag: '🇰🇼', region: 'gulf', layout: 'sa-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'in', label: 'India', flag: '🇮🇳', region: 'south-asia', layout: 'in-cv', showPhoto: true, styleNames: ['Standard Resume', 'Modern', 'Professional'] },
  { code: 'bd', label: 'Bangladesh', flag: '🇧🇩', region: 'south-asia', layout: 'pk-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'ca', label: 'Canada', flag: '🇨🇦', region: 'americas', layout: 'ca-cv', showPhoto: false, styleNames: ['Canadian Resume', 'Modern', 'Professional'] },
  { code: 'au', label: 'Australia', flag: '🇦🇺', region: 'oceania', layout: 'au-cv', showPhoto: false, styleNames: ['Classic CV', 'Modern', 'Professional'] },
  { code: 'jp', label: 'Japan', flag: '🇯🇵', region: 'asia', layout: 'jp-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'kr', label: 'South Korea', flag: '🇰🇷', region: 'asia', layout: 'jp-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'sg', label: 'Singapore', flag: '🇸🇬', region: 'asia', layout: 'sg-cv', showPhoto: true, styleNames: ['Professional CV', 'Modern', 'Executive'] },
  { code: 'my', label: 'Malaysia', flag: '🇲🇾', region: 'asia', layout: 'my-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩', region: 'asia', layout: 'my-cv', showPhoto: true, styleNames: ['CV Formal', 'Modern', 'Professional'] },
  { code: 'ph', label: 'Philippines', flag: '🇵🇭', region: 'asia', layout: 'my-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'ng', label: 'Nigeria', flag: '🇳🇬', region: 'africa', layout: 'ng-cv', showPhoto: true, styleNames: ['Professional CV', 'Modern', 'Formal'] },
  { code: 'za', label: 'South Africa', flag: '🇿🇦', region: 'africa', layout: 'za-cv', showPhoto: true, styleNames: ['Classic CV', 'Modern', 'Professional'] },
  { code: 'eg', label: 'Egypt', flag: '🇪🇬', region: 'africa', layout: 'eg-cv', showPhoto: true, styleNames: ['Formal CV', 'Modern', 'Professional'] },
  { code: 'br', label: 'Brazil', flag: '🇧🇷', region: 'americas', layout: 'br-cv', showPhoto: true, styleNames: ['Currículo Clássico', 'Moderno', 'Profissional'] },
  { code: 'mx', label: 'Mexico', flag: '🇲🇽', region: 'americas', layout: 'br-cv', showPhoto: true, styleNames: ['CV Clásico', 'Moderno', 'Profesional'] },
  { code: 'tr', label: 'Turkey', flag: '🇹🇷', region: 'europe', layout: 'tr-cv', showPhoto: true, styleNames: ['Klasik', 'Modern', 'Profesyonel'] },
];

export const COUNTRY_FILTERS = [
  { id: 'all', label: 'All Countries' },
  ...COUNTRY_CV_CONFIG.map((c) => ({ id: c.code, label: `${c.flag} ${c.label}` })),
];

export const REGION_FILTERS = [
  { id: 'all', label: 'All Regions' },
  { id: 'americas', label: '🌎 Americas' },
  { id: 'europe', label: '🌍 Europe' },
  { id: 'gulf', label: '🕌 Gulf / Middle East' },
  { id: 'south-asia', label: '🌏 South Asia' },
  { id: 'asia', label: '🌏 East & SE Asia' },
  { id: 'africa', label: '🌍 Africa' },
  { id: 'oceania', label: '🌏 Oceania' },
];

export function getCountryConfig(code) {
  return COUNTRY_CV_CONFIG.find((c) => c.code === code);
}

export function getSectionLabelsForCountry(code) {
  return SECTION_LABELS_BY_REGION[code] || SECTION_LABELS_BY_REGION.us;
}
