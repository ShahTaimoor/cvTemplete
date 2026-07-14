import { PLAN_ORDER, getPlanConfig } from '../config/plans.js';

export const userCanUseTemplate = (userPlan, template) => {
  const plan = userPlan || 'free';
  const userIdx = PLAN_ORDER.indexOf(plan);
  const requiredIdx = PLAN_ORDER.indexOf(template.planRequired || 'free');

  if (userIdx >= requiredIdx) return true;

  if (plan === 'free' && !template.isPremium && template.sortOrder <= 2) {
    return true;
  }

  return false;
};

export const enrichTemplateForUser = (template, userPlan) => {
  const doc = template.toObject ? template.toObject() : { ...template };
  const locked = !userCanUseTemplate(userPlan, doc);
  return {
    ...doc,
    locked,
    lockReason: locked ? `Requires ${doc.planRequired} plan or higher` : null,
  };
};

export const userCanCustomizeColors = (userPlan) => {
  return getPlanConfig(userPlan).colorCustomization;
};
