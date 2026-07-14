import { TEMPLATE_CATALOG } from '../config/templateCatalog.js';

const PLAN_ORDER = ['free', 'basic', 'pro', 'premium'];

function planCanUse(userPlan, required) {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(required || 'free');
}

/** Ensure UI shows full catalog even if DB seed is outdated */
export function mergeTemplatesWithCatalog(apiTemplates = [], userPlan = 'free') {
  const bySlug = new Map();

  apiTemplates.forEach((t) => {
    bySlug.set(t.slug, t);
  });

  TEMPLATE_CATALOG.forEach((cat) => {
    const existing = bySlug.get(cat.slug);
    const locked = !planCanUse(userPlan, cat.planRequired);
    const merged = {
      ...(existing || {}),
      _id: existing?._id || cat.slug,
      slug: cat.slug,
      name: cat.name,
      layout: cat.layout,
      category: cat.category,
      countryCode: cat.countryCode,
      countryLabel: cat.countryLabel,
      region: cat.region,
      flag: cat.flag,
      sortOrder: cat.sortOrder,
      isPremium: cat.isPremium,
      planRequired: cat.planRequired,
      locked,
      lockReason: locked ? `Requires ${cat.planRequired} plan or higher` : null,
      defaultTheme: {
        primaryColor: cat.primary,
        secondaryColor: cat.secondary,
        backgroundColor: cat.bg,
        fontFamily: cat.font,
      },
    };
    bySlug.set(cat.slug, merged);
  });

  return [...bySlug.values()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}
