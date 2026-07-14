export const CURRENCY = 'PKR';
export const CURRENCY_LABEL = 'Pakistani Rupee (PKR)';
export const BILLING_PERIOD = 'month';
export const BILLING_PERIOD_LABEL = 'month';

/** Display symbol — "Rs." is standard for PKR in Pakistan */
export const formatPlanPrice = (price) => {
  if (price === 0) return 'Rs. 0';
  return `Rs. ${Number(price).toLocaleString('en-PK')}`;
};

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    pricePkr: 0,
    period: 'month',
    templates: 2,
    tagline: 'Try the builder',
    features: ['2 templates', 'Basic builder', 'PDF export'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 150,
    pricePkr: 150,
    period: 'month',
    templates: 12,
    tagline: 'More layouts for job seekers',
    features: ['12+ templates', 'All sections', 'PDF export'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 300,
    pricePkr: 300,
    period: 'month',
    templates: 55,
    tagline: 'Best for active applications',
    features: ['55+ templates', 'Color customization', 'ATS checker', 'Drag & drop'],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 350,
    pricePkr: 350,
    period: 'month',
    templates: 330,
    tagline: 'Full library & sharing',
    features: ['330+ templates', 'Country CV formats', 'Share link', 'Cover letters'],
  },
];

export const canCustomizeColors = (plan) => ['pro', 'premium'].includes(plan);
