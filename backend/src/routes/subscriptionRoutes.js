import express from 'express';
import { PLANS } from '../config/plans.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/plans', (_req, res) => {
  res.json(Object.values(PLANS));
});

router.get('/current', protect, async (req, res) => {
  const plan = req.user.subscription?.plan || 'free';
  res.json({
    plan,
    config: PLANS[plan],
    subscription: req.user.subscription,
  });
});

router.post('/upgrade', protect, async (req, res) => {
  const { planId } = req.body;
  if (!PLANS[planId] || planId === 'free') {
    return res.status(400).json({ message: 'Invalid plan' });
  }

  const user = await User.findById(req.user._id);
  user.subscription = {
    plan: planId,
    purchasedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };
  await user.save();

  res.json({
    message: `Upgraded to ${PLANS[planId].name} plan`,
    subscription: user.subscription,
    plan: PLANS[planId],
  });
});

export default router;
