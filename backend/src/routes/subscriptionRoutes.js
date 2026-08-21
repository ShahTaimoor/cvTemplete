import express from 'express';
import { PLANS } from '../config/plans.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/plans', (_req, res) => {
  res.json(Object.values(PLANS));
});

router.get('/current', protect, asyncHandler(async (req, res) => {
  const plan = req.user.subscription?.plan || 'free';
  res.json({
    plan,
    config: PLANS[plan],
    subscription: req.user.subscription,
  });
}));

router.post('/upgrade', protect, asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (!PLANS[planId]) {
    return res.status(400).json({ message: 'Invalid plan' });
  }

  const user = await User.findById(req.user._id);
  user.subscription =
    planId === 'free'
      ? { plan: 'free', purchasedAt: null, expiresAt: null }
      : {
          plan: planId,
          purchasedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };
  await user.save();

  res.json({
    message: planId === 'free' ? 'Downgraded to Free plan' : `Upgraded to ${PLANS[planId].name} plan`,
    subscription: user.subscription,
    plan: PLANS[planId],
  });
}));

export default router;
