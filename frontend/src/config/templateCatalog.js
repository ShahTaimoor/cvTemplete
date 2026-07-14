import { COUNTRY_CV_CONFIG, getSectionLabelsForCountry } from './templateCountries.js';

/**
 * Generates 330+ professional resume templates from layout types × color palettes + country CVs.
 */

const FONTS = ['Inter', 'Roboto', 'Georgia', 'Playfair Display'];

const PALETTES = [
  { key: 'royal', label: 'Royal Blue', primary: '#1d4ed8', secondary: '#1e40af', bg: '#ffffff' },
  { key: 'navy', label: 'Navy', primary: '#1e3a5f', secondary: '#334155', bg: '#ffffff' },
  { key: 'indigo', label: 'Indigo', primary: '#4338ca', secondary: '#6366f1', bg: '#f8fafc' },
  { key: 'teal', label: 'Teal', primary: '#0f766e', secondary: '#14b8a6', bg: '#f0fdfa' },
  { key: 'emerald', label: 'Emerald', primary: '#047857', secondary: '#059669', bg: '#f0fdf4' },
  { key: 'slate', label: 'Slate', primary: '#334155', secondary: '#64748b', bg: '#f8fafc' },
  { key: 'charcoal', label: 'Charcoal', primary: '#171717', secondary: '#525252', bg: '#ffffff' },
  { key: 'burgundy', label: 'Burgundy', primary: '#881337', secondary: '#9f1239', bg: '#fff1f2' },
  { key: 'crimson', label: 'Crimson', primary: '#991b1b', secondary: '#dc2626', bg: '#ffffff' },
  { key: 'amber', label: 'Amber', primary: '#b45309', secondary: '#d97706', bg: '#fffbeb' },
  { key: 'violet', label: 'Violet', primary: '#6d28d9', secondary: '#7c3aed', bg: '#faf5ff' },
  { key: 'rose', label: 'Rose', primary: '#be123c', secondary: '#e11d48', bg: '#ffffff' },
  { key: 'cyan', label: 'Cyan', primary: '#0e7490', secondary: '#06b6d4', bg: '#ecfeff' },
  { key: 'copper', label: 'Copper', primary: '#9a3412', secondary: '#c2410c', bg: '#fff7ed' },
  { key: 'olive', label: 'Olive', primary: '#3f6212', secondary: '#65a30d', bg: '#f7fee7' },
];

const LAYOUT_META = [
  { layout: 'classic', category: 'professional', name: 'Classic Pro' },
  { layout: 'minimal', category: 'minimal', name: 'Minimal' },
  { layout: 'corporate', category: 'corporate', name: 'Corporate' },
  { layout: 'elegant', category: 'elegant', name: 'Elegant' },
  { layout: 'tech', category: 'tech', name: 'Tech' },
  { layout: 'sidebar', category: 'sidebar', name: 'Sidebar Left' },
  { layout: 'sidebar-wide', category: 'sidebar', name: 'Wide Sidebar' },
  { layout: 'sidebar-right', category: 'sidebar', name: 'Sidebar Right' },
  { layout: 'sidebar-accent', category: 'sidebar', name: 'Accent Sidebar' },
  { layout: 'sidebar-footer', category: 'sidebar', name: 'Sidebar + Footer' },
  { layout: 'dual-column', category: 'two-column', name: 'Dual Column' },
  { layout: 'narrow-right', category: 'professional', name: 'Narrow Right' },
  { layout: 'asymmetric', category: 'two-column', name: 'Asymmetric' },
  { layout: 'topbar', category: 'modern', name: 'Top Bar' },
  { layout: 'topbar-footer', category: 'modern', name: 'Top Bar & Footer' },
  { layout: 'header-band', category: 'modern', name: 'Header Band' },
  { layout: 'footer-bar', category: 'modern', name: 'Footer Bar' },
  { layout: 'double-header', category: 'executive', name: 'Double Header' },
  { layout: 'centered-hero', category: 'executive', name: 'Centered Hero' },
  { layout: 'modern-header', category: 'modern', name: 'Modern Header' },
  { layout: 'bold', category: 'bold', name: 'Bold Header' },
  { layout: 'banner-photo', category: 'executive', name: 'Banner Photo' },
  { layout: 'header-photo-split', category: 'professional', name: 'Photo Split' },
  { layout: 'split-top', category: 'creative', name: 'Split Top' },
  { layout: 'diagonal-header', category: 'creative', name: 'Diagonal Header' },
  { layout: 'stripe', category: 'creative', name: 'Stripe Blocks' },
  { layout: 'metro', category: 'creative', name: 'Metro Grid' },
  { layout: 'magazine', category: 'creative', name: 'Magazine' },
  { layout: 'cards', category: 'modern', name: 'Card Sections' },
  { layout: 'boxed-sections', category: 'modern', name: 'Boxed Sections' },
  { layout: 'timeline', category: 'modern', name: 'Timeline' },
  { layout: 'infographic', category: 'modern', name: 'Infographic' },
  { layout: 'frame-border', category: 'professional', name: 'Framed' },
  { layout: 'ribbon-left', category: 'creative', name: 'Ribbon Accent' },
  { layout: 'rule-sections', category: 'professional', name: 'Rule Dividers' },
  { layout: 'contact-strip', category: 'professional', name: 'Contact Strip' },
  { layout: 'accent', category: 'design', name: 'Accent Bar' },
  { layout: 'compact-pro', category: 'minimal', name: 'Compact Pro' },
  /* ── New distinct designs ── */
  { layout: 'split-half', category: 'executive', name: 'Split Half' },
  { layout: 'newspaper', category: 'creative', name: 'Newspaper' },
  { layout: 'swiss', category: 'minimal', name: 'Swiss Grid' },
  { layout: 'executive-dark', category: 'executive', name: 'Executive Dark' },
  { layout: 'horizontal-sidebar', category: 'sidebar', name: 'Horizontal Sidebar' },
  { layout: 'polaroid', category: 'creative', name: 'Polaroid' },
  { layout: 'margin-column', category: 'professional', name: 'Margin Column' },
  { layout: 'mosaic-header', category: 'modern', name: 'Mosaic Header' },
  { layout: 'academic', category: 'professional', name: 'Academic' },
  { layout: 'retro', category: 'creative', name: 'Retro Classic' },
  { layout: 'wave-header', category: 'modern', name: 'Wave Header' },
  { layout: 'stacked-bands', category: 'creative', name: 'Stacked Bands' },
  /* ── Batch 2 — more distinct designs ── */
  { layout: 'quote-hero', category: 'executive', name: 'Quote Hero' },
  { layout: 'zigzag', category: 'creative', name: 'Zigzag' },
  { layout: 'numbered-sections', category: 'modern', name: 'Numbered' },
  { layout: 'sidebar-bottom', category: 'sidebar', name: 'Bottom Sidebar' },
  { layout: 'circle-badges', category: 'modern', name: 'Circle Badges' },
  { layout: 'legal-formal', category: 'professional', name: 'Legal Formal' },
  { layout: 'portfolio-grid', category: 'creative', name: 'Portfolio Grid' },
  { layout: 'diagonal-split', category: 'creative', name: 'Diagonal Split' },
  { layout: 'circular-header', category: 'executive', name: 'Circular Header' },
  { layout: 'tab-sections', category: 'modern', name: 'Tab Sections' },
  { layout: 'column-trio', category: 'two-column', name: 'Column Trio' },
  { layout: 'hex-photo', category: 'professional', name: 'Hex Photo' },
  { layout: 'sidebar-duo', category: 'sidebar', name: 'Dual Sidebar' },
  { layout: 'neon-terminal', category: 'tech', name: 'Neon Terminal' },
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const planForIndex = (i) => {
  if (i < 2) return 'free';
  if (i < 12) return 'basic';
  if (i < 55) return 'pro';
  return 'premium';
};

export function buildTemplateCatalog() {
  const catalog = [];
  let sortOrder = 1;

  LAYOUT_META.forEach((meta, layoutIndex) => {
    for (let pi = 0; pi < 4; pi++) {
      const palette = PALETTES[(layoutIndex * 2 + pi) % PALETTES.length];
      const slug = `${slugify(meta.layout)}-${palette.key}${pi > 0 ? `-${pi + 1}` : ''}`;
      const font = ['elegant', 'centered-hero', 'academic', 'retro', 'legal-formal'].includes(meta.layout)
        ? 'Playfair Display'
        : ['tech', 'swiss', 'neon-terminal'].includes(meta.layout)
          ? 'Roboto'
          : pi % 2 === 0
            ? 'Inter'
            : FONTS[pi % FONTS.length];

      catalog.push({
        slug,
        name: `${palette.label} ${meta.name}`,
        layout: meta.layout,
        category: meta.category,
        primary: palette.primary,
        secondary: palette.secondary,
        bg: palette.bg,
        font,
        sortOrder: sortOrder++,
        isPremium: sortOrder > 3,
        planRequired: planForIndex(sortOrder - 1),
      });
    }
  });

  // Country / regional CV templates (US, UK, PK, SA, EU, etc.)
  COUNTRY_CV_CONFIG.forEach((country, ci) => {
    country.styleNames.forEach((styleName, si) => {
      const palette = PALETTES[(ci * 3 + si) % PALETTES.length];
      const slug = `cv-${country.code}-${palette.key}${si > 0 ? `-v${si + 1}` : ''}`;
      const font = ['fr-cv', 'de-cv'].includes(country.layout) || ['fr', 'it', 'es'].includes(country.code)
        ? 'Playfair Display'
        : ['jp-cv', 'kr'].includes(country.code) ? 'Roboto' : 'Inter';

      catalog.push({
        slug,
        name: `${country.flag} ${country.label} — ${styleName}`,
        layout: country.layout,
        category: 'regional',
        countryCode: country.code,
        countryLabel: country.label,
        region: country.region,
        flag: country.flag,
        showPhoto: country.showPhoto,
        primary: palette.primary,
        secondary: palette.secondary,
        bg: palette.bg,
        font,
        sortOrder: sortOrder++,
        isPremium: true,
        planRequired: planForIndex(sortOrder - 1),
      });
    });
  });

  // Legacy slugs used in sample data / defaults
  const legacy = [
    { slug: 'classic-blue', layout: 'classic', name: 'Classic Blue', primary: '#2563eb', secondary: '#1e40af', bg: '#ffffff', font: 'Inter', category: 'professional', sortOrder: 0, planRequired: 'free' },
    { slug: 'minimal-clean', layout: 'minimal', name: 'Minimal Clean', primary: '#111827', secondary: '#6b7280', bg: '#ffffff', font: 'Roboto', category: 'minimal', sortOrder: 0, planRequired: 'free' },
  ];
  legacy.forEach((l) => {
    if (!catalog.find((c) => c.slug === l.slug)) catalog.unshift({ ...l, isPremium: false, sortOrder: l.sortOrder });
  });

  catalog.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  catalog.forEach((t, i) => {
    t.sortOrder = i + 1;
    t.isPremium = i >= 2;
    t.planRequired = planForIndex(i);
  });

  return catalog;
}

export const TEMPLATE_CATALOG = buildTemplateCatalog();

export function catalogToPresets(catalog = TEMPLATE_CATALOG) {
  return Object.fromEntries(
    catalog.map((t) => [
      t.slug,
      {
        layout: t.layout,
        primary: t.primary,
        secondary: t.secondary,
        bg: t.bg,
        font: t.font,
        countryCode: t.countryCode,
        countryLabel: t.countryLabel,
        region: t.region,
        flag: t.flag,
        showPhoto: t.showPhoto,
        sectionLabels: t.countryCode ? getSectionLabelsForCountry(t.countryCode) : undefined,
      },
    ])
  );
}
