import express from 'express';
import Template from '../models/Template.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { enrichTemplateForUser } from '../utils/templateAccess.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const plan = req.user?.subscription?.plan || 'free';
  const templates = await Template.find().sort({ sortOrder: 1 });
  const enriched = templates.map((t) => enrichTemplateForUser(t, plan));
  res.json(enriched);
}));

router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const template = await Template.findOne({ slug: req.params.slug });
  if (!template) {
    return res.status(404).json({ message: 'Template not found' });
  }
  const plan = req.user?.subscription?.plan || 'free';
  res.json(enrichTemplateForUser(template, plan));
}));

export default router;
