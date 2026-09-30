import FreePeriod from '../models/FreePeriod.js';
import { PLAN_ORDER } from '../config/plans.js';

// Every request hits this, so keep the setting in memory briefly. Saving from
// the admin page clears it, so a change applies immediately on this instance.
const CACHE_MS = 15 * 1000;
let cache = { at: 0, value: null };

export const clearFreePeriodCache = () => {
  cache = { at: 0, value: null };
};

export const getFreePeriod = async () => {
  if (Date.now() - cache.at < CACHE_MS) return cache.value;
  const doc = await FreePeriod.findOne({ key: 'default' }).lean();
  cache = { at: Date.now(), value: doc };
  return doc;
};

export const isFreePeriodActive = (fp, now = new Date()) =>
  Boolean(fp?.enabled && fp.startsAt && fp.endsAt && now >= fp.startsAt && now <= fp.endsAt);

export const publicFreePeriod = (fp) => ({
  active: isFreePeriodActive(fp),
  enabled: Boolean(fp?.enabled),
  startsAt: fp?.startsAt || null,
  endsAt: fp?.endsAt || null,
});

// Returns a plain copy of the user whose subscription reads as Premium while a
// free period is running (unless they already have a higher plan — there is
// none above Premium). The stored document is never touched.
export const withFreePeriodPlan = async (user) => {
  if (!user) return user;
  const fp = await getFreePeriod();
  const obj = user.toObject ? user.toObject() : { ...user };
  if (!isFreePeriodActive(fp)) return obj;
  const top = PLAN_ORDER[PLAN_ORDER.length - 1];
  obj.subscription = {
    ...obj.subscription,
    plan: top,
    freePeriod: true,
    freePeriodEndsAt: fp.endsAt,
  };
  return obj;
};
