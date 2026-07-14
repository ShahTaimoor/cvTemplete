export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'PKR',
    billingPeriod: 'month',
    templateLimit: 2,
    colorCustomization: false,
    features: ['2 templates', 'Basic resume builder', 'PDF export'],
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 150,
    currency: 'PKR',
    billingPeriod: 'month',
    templateLimit: 12,
    colorCustomization: false,
    features: ['12+ templates', 'All basic sections', 'PDF export'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 300,
    currency: 'PKR',
    billingPeriod: 'month',
    templateLimit: 55,
    colorCustomization: true,
    features: ['55+ templates', 'Color customization', 'Drag & drop sections', 'ATS checker'],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 350,
    currency: 'PKR',
    billingPeriod: 'month',
    templateLimit: 330,
    colorCustomization: true,
    features: [
      '144 templates',
      'All features',
      'ATS checker',
      'Share link',
      'Cover letters',
    ],
  },
};

export const PLAN_ORDER = ['free', 'basic', 'pro', 'premium'];

export const getPlanConfig = (planId) => PLANS[planId] || PLANS.free;

export const canAccessTemplate = (userPlan, template) => {
  const plan = getPlanConfig(userPlan);
  if (!template.isPremium && template.planRequired === 'free') return true;
  const requiredIndex = PLAN_ORDER.indexOf(template.planRequired || 'free');
  const userIndex = PLAN_ORDER.indexOf(userPlan || 'free');
  if (userIndex >= requiredIndex) return true;
  const freeTemplates = template.sortOrder <= 2;
  return !template.isPremium && freeTemplates;
};

export const getTemplateLimit = (planId) => getPlanConfig(planId).templateLimit;
