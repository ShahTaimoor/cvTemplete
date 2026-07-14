import { getTemplatePreset } from './templates.js';
import { COUNTRY_FILTERS, REGION_FILTERS } from './templateCountries.js';

/** Filter templates using layout from API (reliable) with slug preset fallback */
export const TEMPLATE_FILTERS = [
  { id: 'all', label: 'All Styles' },
  { id: 'regional', label: '🌍 Country CVs' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'headers', label: 'Top & Footer' },
  { id: 'boxed', label: 'Boxed Sections' },
  { id: 'two-column', label: 'Two Column' },
  { id: 'creative', label: 'Creative' },
  { id: 'classic', label: 'Classic' },
];

export { COUNTRY_FILTERS, REGION_FILTERS };

const REGIONAL_LAYOUTS = [
  'us-resume', 'uk-cv', 'eu-cv', 'de-cv', 'fr-cv', 'pk-cv', 'sa-cv', 'ae-cv',
  'in-cv', 'ca-cv', 'au-cv', 'jp-cv', 'ng-cv', 'br-cv', 'za-cv', 'my-cv',
  'sg-cv', 'eg-cv', 'tr-cv',
];

const LAYOUTS_BY_FILTER = {
  regional: REGIONAL_LAYOUTS,
  sidebar: ['sidebar', 'sidebar-wide', 'sidebar-right', 'sidebar-accent', 'sidebar-footer', 'narrow-right', 'horizontal-sidebar', 'sidebar-bottom', 'sidebar-duo'],
  headers: [
    'topbar', 'topbar-footer', 'footer-bar', 'header-band', 'double-header', 'contact-strip',
    'modern-header', 'bold', 'banner-photo', 'header-photo-split', 'split-top', 'diagonal-header',
    'executive-dark', 'wave-header', 'mosaic-header', 'split-half', 'quote-hero', 'circular-header', 'hex-photo',
  ],
  boxed: ['boxed-sections', 'rule-sections', 'frame-border', 'cards', 'retro', 'academic', 'legal-formal'],
  'two-column': ['dual-column', 'asymmetric', 'newspaper', 'margin-column', 'column-trio'],
  creative: [
    'magazine', 'stripe', 'metro', 'infographic', 'timeline', 'accent', 'ribbon-left',
    'centered-hero', 'compact-pro', 'polaroid', 'stacked-bands', 'swiss', 'zigzag',
    'portfolio-grid', 'diagonal-split',
  ],
  classic: ['classic', 'minimal', 'elegant', 'corporate', 'tech', 'neon-terminal'],
};

export function resolveTemplateLayout(template) {
  return template?.layout || getTemplatePreset(template?.slug).layout;
}

export function resolveTemplateCountry(template) {
  return template?.countryCode || getTemplatePreset(template?.slug).countryCode;
}

export function resolveTemplateRegion(template) {
  return template?.region || getTemplatePreset(template?.slug).region;
}

export function matchesTemplateFilter(template, filterId) {
  if (filterId === 'all') return true;
  const layout = resolveTemplateLayout(template);
  const allowed = LAYOUTS_BY_FILTER[filterId];
  return allowed ? allowed.includes(layout) : true;
}

export function matchesCountryFilter(template, countryId) {
  if (!countryId || countryId === 'all') return true;
  return resolveTemplateCountry(template) === countryId;
}

export function matchesRegionFilter(template, regionId) {
  if (!regionId || regionId === 'all') return true;
  return resolveTemplateRegion(template) === regionId;
}

export function filterTemplates(templates, filterId, search = '', countryId = 'all', regionId = 'all') {
  const q = search.toLowerCase().trim();
  return templates.filter((t) => {
    if (!matchesTemplateFilter(t, filterId)) return false;
    if (!matchesCountryFilter(t, countryId)) return false;
    if (!matchesRegionFilter(t, regionId)) return false;
    if (!q) return true;
    const layout = resolveTemplateLayout(t);
    return (
      t.name?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.slug?.toLowerCase().includes(q) ||
      t.countryLabel?.toLowerCase().includes(q) ||
      t.countryCode?.toLowerCase().includes(q) ||
      layout?.toLowerCase().includes(q)
    );
  });
}

/** Section title + card blocks (like PROJECTS with line + gray card) */
export function getSectionVariantForLayout(layout) {
  if ([
    'boxed-sections', 'rule-sections', 'frame-border', 'cards', 'classic', 'corporate',
    'centered-hero', 'academic', 'retro', 'stacked-bands', 'legal-formal', 'numbered-sections',
    'tab-sections', 'uk-cv', 'pk-cv', 'sa-cv', 'ae-cv', 'de-cv',
  ].includes(layout)) {
    return 'rule-accent';
  }
  return 'default';
}
