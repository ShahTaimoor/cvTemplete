const PAID_PLANS = ['basic', 'pro', 'premium'];

export const canUsePaidResumeFields = (plan) => PAID_PLANS.includes(plan);

const blank = (obj, keys, empty = '') => {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = { ...obj };
  keys.forEach((k) => {
    if (k in copy) copy[k] = empty;
  });
  return copy;
};

const blankEach = (list, keys, empty) =>
  Array.isArray(list) ? list.map((item) => blank(item, keys, empty)) : list;

/**
 * Free accounts can't store a profile photo, email, phone, website/LinkedIn,
 * job start/end dates, or project/certification URLs. The editor locks these
 * inputs, but the API is the real gate: anything a free account sends for
 * them is blanked, so editing the request can't get around the lock.
 * Returns a copy; paid plans get the data back untouched.
 */
export const stripPaidResumeFields = (plan, data) => {
  if (!data || canUsePaidResumeFields(plan)) return data;

  const next = { ...data };
  if ('personal' in next) {
    next.personal = blank(next.personal, ['photo', 'email', 'phone', 'website', 'linkedin']);
  }
  if ('experience' in next) {
    next.experience = blankEach(next.experience, ['startDate', 'endDate']);
    next.experience = blankEach(next.experience, ['current'], false);
  }
  if ('education' in next) next.education = blankEach(next.education, ['startDate', 'endDate']);
  if ('projects' in next) next.projects = blankEach(next.projects, ['url']);
  if ('certifications' in next) next.certifications = blankEach(next.certifications, ['url']);
  return next;
};
