import express from 'express';
import User from '../models/User.js';
import PurchaseRequest from '../models/PurchaseRequest.js';
import PaymentMethod from '../models/PaymentMethod.js';
import { PLANS } from '../config/plans.js';
import { protect, requireSuperAdmin } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Everything under /api/admin is super-admin only.
router.use(protect, requireSuperAdmin);

const STATUSES = ['pending', 'approved', 'rejected'];

// List purchase requests, newest first. ?status=pending (default) | approved
// | rejected | all
router.get('/purchase-requests', asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const filter = STATUSES.includes(status) ? { status } : {};

  const requests = await PurchaseRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate('user', 'name email subscription')
    .populate('reviewedBy', 'name email');

  res.json({ requests });
}));

// Pending count for the sidebar badge.
router.get('/purchase-requests/count', asyncHandler(async (_req, res) => {
  const pending = await PurchaseRequest.countDocuments({ status: 'pending' });
  res.json({ pending });
}));

router.post('/purchase-requests/:id/approve', asyncHandler(async (req, res) => {
  const request = await PurchaseRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'pending') {
    return res.status(400).json({ message: `Request already ${request.status}` });
  }
  if (!PLANS[request.plan]) {
    return res.status(400).json({ message: 'Requested plan no longer exists' });
  }

  const user = await User.findById(request.user);
  if (!user) return res.status(404).json({ message: 'Requesting user not found' });

  const now = new Date();
  user.subscription = {
    plan: request.plan,
    purchasedAt: now,
    expiresAt: new Date(now.getTime() + request.durationDays * 24 * 60 * 60 * 1000),
  };
  await user.save();

  request.status = 'approved';
  request.reviewedBy = req.user._id;
  request.reviewedAt = now;
  await request.save();

  res.json({
    message: `Approved — ${user.email} is now on the ${PLANS[request.plan].name} plan`,
    request,
    subscription: user.subscription,
  });
}));

router.post('/purchase-requests/:id/reject', asyncHandler(async (req, res) => {
  const request = await PurchaseRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ message: 'Request not found' });
  if (request.status !== 'pending') {
    return res.status(400).json({ message: `Request already ${request.status}` });
  }

  const { note } = req.body;
  request.status = 'rejected';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.reviewNote = typeof note === 'string' ? note.trim().slice(0, 500) : '';
  await request.save();

  res.json({ message: 'Request rejected', request });
}));

// ─── Payment methods shown to users in the "Request a plan" dialog ───
const METHOD_TYPES = ['easypaisa', 'jazzcash', 'bank', 'other'];

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Whitelists and trims what the client sends; returns { data } or { error }.
const readMethodBody = (body) => {
  const data = {
    type: METHOD_TYPES.includes(body.type) ? body.type : 'bank',
    label: str(body.label, 60),
    accountName: str(body.accountName, 100),
    accountNumber: str(body.accountNumber, 60),
    note: str(body.note, 300),
    isActive: body.isActive !== false,
  };
  if (!data.accountName) return { error: 'Account name is required' };
  if (!data.accountNumber) return { error: 'Account number is required' };
  return { data };
};

router.get('/payment-methods', asyncHandler(async (_req, res) => {
  const methods = await PaymentMethod.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ methods });
}));

router.post('/payment-methods', asyncHandler(async (req, res) => {
  const { data, error } = readMethodBody(req.body);
  if (error) return res.status(400).json({ message: error });
  const last = await PaymentMethod.findOne().sort({ sortOrder: -1 });
  const method = await PaymentMethod.create({ ...data, sortOrder: (last?.sortOrder ?? -1) + 1 });
  res.status(201).json({ method });
}));

router.put('/payment-methods/:id', asyncHandler(async (req, res) => {
  const { data, error } = readMethodBody(req.body);
  if (error) return res.status(400).json({ message: error });
  const method = await PaymentMethod.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });
  if (!method) return res.status(404).json({ message: 'Payment method not found' });
  res.json({ method });
}));

router.delete('/payment-methods/:id', asyncHandler(async (req, res) => {
  const method = await PaymentMethod.findByIdAndDelete(req.params.id);
  if (!method) return res.status(404).json({ message: 'Payment method not found' });
  res.json({ message: 'Payment method deleted' });
}));

export default router;
