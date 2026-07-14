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
