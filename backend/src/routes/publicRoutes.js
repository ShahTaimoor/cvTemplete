import express from 'express';
import Resume from '../models/Resume.js';
import Template from '../models/Template.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.get('/share/:token', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({
    shareToken: req.params.token,
    isPublic: true,
  }).select('-user');
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found or not shared' });
  }
  const template = await Template.findOne({ slug: resume.templateSlug });
  res.json({ resume, template });

  // Fire-and-forget: never let analytics logging affect the public view response.
  AnalyticsEvent.create({ resume: resume._id, type: 'view' }).catch((err) =>
    console.error('Analytics view tracking failed:', err)
  );
}));

export default router;
