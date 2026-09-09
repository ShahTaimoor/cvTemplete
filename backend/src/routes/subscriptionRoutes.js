import express from 'express';
import { PLANS, PLAN_ORDER } from '../config/plans.js';
import User from '../models/User.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
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

// Instant path — only Free is allowed here now. Moving onto a paid plan goes
// through POST /request and a super admin's approval (see below).
router.post('/upgrade', protect, asyncHandler(async (req, res) => {
  const { planId } = req.body;
  if (planId !== 'free') {
    return res.status(400).json({
      message: 'Paid plans require admin approval. Submit a purchase request instead.',
    });
  }

  const user = await User.findById(req.user._id);
  user.subscription = { plan: 'free', purchasedAt: null, expiresAt: null };
  await user.save();

  res.json({
    message: 'Downgraded to Free plan',
    subscription: user.subscription,
    plan: PLANS.free,
  });
}));

// User asks to move onto a paid plan. Nothing about their subscription
// changes here — this just creates a pending request for a super admin.
router.post('/request', protect, asyncHandler(async (req, res) => {
  const { planId, reference, receiptUrl } = req.body;

  if (!PLANS[planId] || planId === 'free') {
    return res.status(400).json({ message: 'Choose a valid paid plan' });
  }

  // The screenshot is uploaded first via POST /api/upload/receipt, which
  // returns the URL passed here. Only accept a same-app URL, not an
  // arbitrary external link.
  const cleanReceiptUrl = typeof receiptUrl === 'string' ? receiptUrl.trim() : '';
  const isValidReceipt =
    /^https:\/\/res\.cloudinary\.com\//.test(cleanReceiptUrl) ||
    /^\/uploads\/[\w.-]+$/.test(cleanReceiptUrl);
  if (!cleanReceiptUrl || !isValidReceipt) {
    return res.status(400).json({ message: 'A payment screenshot is required' });
  }

  const currentPlan = req.user.subscription?.plan || 'free';
  if (PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(planId)) {
    return res.status(400).json({ message: `You are already on the ${currentPlan} plan or higher` });
  }

  const existingPending = await PurchaseRequest.findOne({
    user: req.user._id,
    status: 'pending',
  });
  if (existingPending) {
    return res.status(409).json({
      message: 'You already have a purchase request awaiting approval',
      request: existingPending,
    });
  }

  const request = await PurchaseRequest.create({
    user: req.user._id,
    plan: planId,
    amount: PLANS[planId].price,
    currency: PLANS[planId].currency || 'PKR',
    reference: typeof reference === 'string' ? reference.trim().slice(0, 200) : '',
    receiptUrl: cleanReceiptUrl,
  });

  res.status(201).json({
    message: 'Purchase request submitted. Your plan starts once an admin approves it.',
    request,
  });
}));

// The caller's most recent request (any status), or null — drives the
// "pending approval" / "rejected" hints on the pricing page.
router.get('/request/mine', protect, asyncHandler(async (req, res) => {
  const request = await PurchaseRequest.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ request: request || null });
}));

export default router;
