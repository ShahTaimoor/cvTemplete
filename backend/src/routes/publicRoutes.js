import express from 'express';
import Resume from '../models/Resume.js';
import CoverLetter from '../models/CoverLetter.js';
import Template from '../models/Template.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// Defense-in-depth against duplicate view-logging, independent of the
// client-side mount-guard in SharePage.jsx (the actual fix for the known
// StrictMode double-fire — see that file). This exists for any *other*
// future cause of two near-identical requests landing back-to-back (a
// network retry, a double-click, etc.): if the same resume is fetched again
// within VIEW_DEDUPE_MS, the repeat isn't logged as a second view.
// Per-process/in-memory and short-lived by design — it isn't meant to
// dedupe genuinely distinct visits (e.g. two different people opening the
// same link seconds apart), only an accidental immediate repeat of the
// exact same request.
const recentResumeViews = new Map(); // resumeId -> last-logged timestamp
const VIEW_DEDUPE_MS = 2000;

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
  const resumeId = String(resume._id);
  const now = Date.now();
  const lastLoggedAt = recentResumeViews.get(resumeId);
  if (!lastLoggedAt || now - lastLoggedAt > VIEW_DEDUPE_MS) {
    recentResumeViews.set(resumeId, now);
    AnalyticsEvent.create({ resume: resume._id, type: 'view' }).catch((err) =>
      console.error('Analytics view tracking failed:', err)
    );
  }
}));

// Deliberately a distinct path (not /share/:token) rather than sharing
// Resume's route — Resume and CoverLetter each enforce shareToken
// uniqueness independently (separate collections), so a single shared path
// could ambiguously match either model's token. No analytics logging here
// yet: this is plumbing only, view-tracking is a deliberate follow-up once
// real share links exist to generate data from.
router.get('/share/cover-letter/:token', asyncHandler(async (req, res) => {
  const letter = await CoverLetter.findOne({
    shareToken: req.params.token,
    isPublic: true,
  }).select('-user');
  if (!letter) {
    return res.status(404).json({ message: 'Cover letter not found or not shared' });
  }
  res.json({ letter });
}));

export default router;
