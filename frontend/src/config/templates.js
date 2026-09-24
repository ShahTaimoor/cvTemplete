import { TEMPLATE_CATALOG, catalogToPresets, buildTemplateCatalog } from './templateCatalog.js';
import { getSectionVariantForLayout } from './templateFilters.js';

export { TEMPLATE_CATALOG, buildTemplateCatalog };

/** @type {Record<string, { layout: string, primary: string, secondary: string, bg: string, font: string }>} */
export const TEMPLATE_PRESETS = catalogToPresets();

export const getTemplatePreset = (slug) =>
  TEMPLATE_PRESETS[slug] || TEMPLATE_PRESETS['classic-blue'] || TEMPLATE_PRESETS['classic-royal'];

export const LAYOUT_FILTER_GROUPS = {
  sidebar: [
    'sidebar',
    'sidebar-wide',
    'sidebar-right',
    'sidebar-accent',
    'sidebar-footer',
    'narrow-right',
  ],
  'two-column': ['dual-column', 'asymmetric'],
  creative: [
    'magazine',
    'stripe',
    'cards',
    'metro',
    'banner-photo',
    'header-photo-split',
    'diagonal-header',
    'split-top',
    'infographic',
    'timeline',
    'bold',
    'modern-header',
    'accent',
    'ribbon-left',
    'header-band',
    'double-header',
  ],
  classic: [
    'classic',
    'minimal',
    'elegant',
    'corporate',
    'tech',
    'topbar',
    'topbar-footer',
    'footer-bar',
    'centered-hero',
    'frame-border',
    'rule-sections',
    'contact-strip',
    'compact-pro',
  ],
};

// Layouts whose renderer actually draws personal.photo (see ResumeLayouts.jsx /
// RegionalResumeLayouts.jsx). Layouts not listed here have no photo slot, so
// the editor hides the upload for them. Regional layouts that delegate to
// another (ng→pk, my→in, eg→sa, tr→eu) follow the layout they delegate to;
// us/uk/ca/au/za CVs are photo-free by convention.
const PHOTO_LAYOUTS = new Set([
  'classic', 'sidebar', 'sidebar-wide', 'sidebar-right', 'sidebar-accent', 'timeline', 'metro',
  'banner-photo', 'header-photo-split', 'magazine', 'narrow-right', 'infographic', 'centered-hero',
  'sidebar-footer', 'split-half', 'executive-dark', 'horizontal-sidebar', 'polaroid',
  'sidebar-bottom', 'circular-header', 'hex-photo', 'sidebar-duo',
  'eu-cv', 'de-cv', 'fr-cv', 'pk-cv', 'sa-cv', 'ae-cv', 'in-cv', 'jp-cv', 'br-cv', 'sg-cv',
  'ng-cv', 'my-cv', 'eg-cv', 'tr-cv',
]);

export const templateSupportsPhoto = (slug) => PHOTO_LAYOUTS.has(getTemplatePreset(slug).layout);

export const getLayoutGroup = (slug, layoutFromTemplate) => {
  const layout = layoutFromTemplate || getTemplatePreset(slug).layout;
  for (const [group, layouts] of Object.entries(LAYOUT_FILTER_GROUPS)) {
    if (layouts.includes(layout)) return group;
  }
  return 'classic';
};

export const getResumeStyle = (resume, templateSlug) => {
  const preset = getTemplatePreset(templateSlug || resume?.templateSlug);
  const theme = resume?.theme || {};
  const layout = preset.layout;
  return {
    primary: theme.primaryColor || preset.primary,
    secondary: theme.secondaryColor || preset.secondary,
    bg: theme.backgroundColor || preset.bg,
    font: theme.fontFamily || preset.font,
    layout,
    sectionVariant: getSectionVariantForLayout(layout),
    sectionLabels: preset.sectionLabels,
    countryCode: preset.countryCode,
    countryLabel: preset.countryLabel,
    region: preset.region,
    showPhoto: preset.showPhoto,
  };
};

/** Shared by any renderer that calls renderLayout() directly (ResumePreview,
 * the print-optimized PrintPage) so the layout->Sections-variant mapping
 * only lives in one place. */
export const getPreviewVariant = (style) => {
  if (!style) return 'default';
  if (['minimal', 'tech'].includes(style.layout)) return 'minimal';
  if (style.layout === 'elegant') return 'elegant';
  return 'default';
};
