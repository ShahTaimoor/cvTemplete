import express from 'express';
import Resume from '../models/Resume.js';
import ResumeVersion from '../models/ResumeVersion.js';
import CoverLetter from '../models/CoverLetter.js';
import Template from '../models/Template.js';
import AnalyticsEvent from '../models/AnalyticsEvent.js';
import { protect } from '../middleware/auth.js';
import { userCanUseTemplate, userCanCustomizeColors } from '../utils/templateAccess.js';
import { analyzeResume } from '../services/atsService.js';
import { buildResumeDocx } from '../services/docxService.js';
import { generateResumePdf } from '../services/pdfService.js';
import { generateResumeThumbnail, saveResumeThumbnail, shouldRegenerateThumbnail } from '../services/thumbnailService.js';
import { getSampleResumePayload } from '../utils/sampleResumeData.js';
import { exportLimiter } from '../middleware/security.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildDailyTimeline, timelineStartDate } from '../utils/analytics.js';

const router = express.Router();
router.use(protect);

const THEME_KEYS = ['primaryColor', 'secondaryColor', 'backgroundColor', 'fontFamily'];

// A theme object is only a genuine customization attempt if it actually
// deviates from the active template's own default theme — switching
// templates (or autosaving unrelated fields) always re-sends the current
// theme verbatim, and that must not trip the plan gate below.
const isThemeCustomized = (incomingTheme, defaultTheme) =>
  THEME_KEYS.some((key) => {
    const value = incomingTheme[key];
    return value !== undefined && value !== defaultTheme?.[key];
  });

const resumeSnapshot = (doc) => {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  delete o._id;
  delete o.user;
  delete o.createdAt;
  delete o.updatedAt;
  delete o.__v;
  delete o.shareToken;
  o.isPublic = false;
  return o;
};

router.get('/', asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .select('-__v');
  res.json(resumes);
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const VIEWS_WINDOW_DAYS = 7;
const STALE_THRESHOLD_DAYS = 30;
// Reserved per content type (not a single shared cap) — see the
// reserve-then-backfill logic in dashboard-insight below. A shared cap
// combined with resumes always sorting ahead of cover letters on ties
// used to let a user with 4+ active resumes silently starve out cover
// letter activity from the list even when it was real and confirmed via
// the per-item analytics endpoint.
const RESUME_ACTIVITY_SLOTS = 6;
const COVER_LETTER_ACTIVITY_SLOTS = 6;

// Registered ahead of GET /:id — as a literal path with no params, it would
// otherwise be swallowed by that route (Express would match "dashboard-
// insight" as an :id value).
//
// One real, data-backed insight per Dashboard visit, gated the same as the
// existing per-resume analytics endpoint below. Pro accounts can never
// generate Cover Letter activity at all (that feature is Premium-only) and
// can never generate view events on resumes either (Share links are also
// Premium-only) — their downloads still surface here even though those
// other two never will. No special-casing needed for either: the queries
// below just naturally return empty for content/events a Pro account can't
// have.
router.get('/dashboard-insight', asyncHandler(async (req, res) => {
  const plan = req.user.subscription?.plan || 'free';
  if (!['pro', 'premium'].includes(plan)) {
    return res.status(403).json({ message: 'Dashboard insights require Pro plan or higher' });
  }

  const [resumes, coverLetters] = await Promise.all([
    Resume.find({ user: req.user._id }).select('_id title updatedAt'),
    CoverLetter.find({ user: req.user._id }).select('_id title updatedAt'),
  ]);
  if (!resumes.length && !coverLetters.length) return res.json({ type: 'none' });

  // Every resume/cover letter with real activity this week, not just the
  // single busiest one — content that isn't the top performer can still
  // have genuine views/downloads worth surfacing, and hiding those
  // undersells real engagement the user should see. Two separate
  // aggregations (grouped on different AnalyticsEvent fields) merged and
  // re-ranked together, rather than one combined query, since `resume` and
  // `coverLetter` are distinct fields on the event, not a shared key.
  const since = new Date(Date.now() - VIEWS_WINDOW_DAYS * DAY_MS);
  const activityByField = (field, ids) =>
    AnalyticsEvent.aggregate([
      { $match: { [field]: { $in: ids }, type: { $in: ['view', 'download'] }, createdAt: { $gte: since } } },
      {
        $group: {
          _id: `$${field}`,
          views: { $sum: { $cond: [{ $eq: ['$type', 'view'] }, 1, 0] } },
          downloads: { $sum: { $cond: [{ $eq: ['$type', 'download'] }, 1, 0] } },
        },
      },
    ]);
  const [resumeActivity, coverLetterActivity] = await Promise.all([
    resumes.length ? activityByField('resume', resumes.map((r) => r._id)) : [],
    coverLetters.length ? activityByField('coverLetter', coverLetters.map((c) => c._id)) : [],
  ]);

  // Ranked independently per type (not merged-then-capped) so neither type
  // can structurally crowd the other out of its own reserved slots. Each
  // type gets its own top-N reservation; if a type doesn't have enough real
  // activity to fill its reservation, the leftover slots backfill from the
  // OTHER type's remaining ranked items (beyond its own reservation) rather
  // than sitting empty or being handed back unused — real activity from
  // either type always fills the list before it's cut short.
  const rankByTotal = (activity, type, contentDocs, untitledFallback) =>
    activity
      .map((a) => {
        const doc = contentDocs.find((c) => c._id.equals(a._id));
        return {
          type,
          id: a._id,
          title: doc?.title || untitledFallback,
          views: a.views,
          downloads: a.downloads,
          total: a.views + a.downloads,
        };
      })
      .sort((a, b) => b.total - a.total);

  const resumeRanked = rankByTotal(resumeActivity, 'resume', resumes, 'Untitled Resume');
  const coverLetterRanked = rankByTotal(coverLetterActivity, 'coverLetter', coverLetters, 'Untitled Cover Letter');

  const resumeTake = resumeRanked.slice(0, RESUME_ACTIVITY_SLOTS);
  const coverLetterTake = coverLetterRanked.slice(0, COVER_LETTER_ACTIVITY_SLOTS);
  const unusedResumeSlots = RESUME_ACTIVITY_SLOTS - resumeTake.length;
  const unusedCoverLetterSlots = COVER_LETTER_ACTIVITY_SLOTS - coverLetterTake.length;

  const items = [
    ...resumeTake,
    ...coverLetterTake,
    // Backfill: unused reserved slots on one side pull from the other
    // side's remaining ranked items (past its own reservation cut).
    ...coverLetterRanked.slice(COVER_LETTER_ACTIVITY_SLOTS, COVER_LETTER_ACTIVITY_SLOTS + unusedResumeSlots),
    ...resumeRanked.slice(RESUME_ACTIVITY_SLOTS, RESUME_ACTIVITY_SLOTS + unusedCoverLetterSlots),
  ]
    .sort((a, b) => b.total - a.total)
    .map(({ total, ...item }) => item);

  if (items.length) {
    return res.json({ type: 'activity', items });
  }

  // updatedAt also gets bumped by the background thumbnail-regeneration
  // write (see thumbnailService.js/resumeRoutes.js's own POST /:id/thumbnail
  // handler), not just genuine content edits — a resume whose thumbnail was
  // silently regenerated recently will look "freshly updated" here even if
  // its actual content is old. Acceptable for a soft, best-effort nudge like
  // this; a true "content last edited" signal would need its own field.
  const staleThreshold = new Date(Date.now() - STALE_THRESHOLD_DAYS * DAY_MS);
  const staleCandidates = [
    ...resumes.map((r) => ({ type: 'resume', title: r.title, updatedAt: r.updatedAt })),
    ...coverLetters.map((c) => ({ type: 'coverLetter', title: c.title, updatedAt: c.updatedAt })),
  ]
    .filter((c) => c.updatedAt <= staleThreshold)
    .sort((a, b) => a.updatedAt - b.updatedAt);

  if (staleCandidates.length) {
    const stalest = staleCandidates[0];
    const daysSinceUpdate = Math.floor((Date.now() - stalest.updatedAt.getTime()) / DAY_MS);
    return res.json({ type: 'stale', title: stalest.title, daysSinceUpdate });
  }

  res.json({ type: 'none' });
}));

router.post('/', asyncHandler(async (req, res) => {
  const slug = req.body.templateSlug || 'classic-blue';
  const template = await Template.findOne({ slug });
  const plan = req.user.subscription?.plan || 'free';

  if (!template) {
    return res.status(404).json({ message: 'Unknown template' });
  }
  if (!userCanUseTemplate(plan, template)) {
    return res.status(403).json({ message: 'Template locked. Upgrade your plan.' });
  }

  const count = await Resume.countDocuments({ user: req.user._id });
  const useSample = req.body.withSampleData !== false && (count === 0 || req.body.withSampleData === true);
  const sample = useSample ? getSampleResumePayload() : {};

  const resume = await Resume.create({
    user: req.user._id,
    title: req.body.title || sample.title || 'Untitled Resume',
    templateSlug: template.slug,
    templateId: template._id,
    theme: template.defaultTheme || sample.theme,
    personal: sample.personal,
    summary: sample.summary,
    education: sample.education,
    experience: sample.experience,
    skills: sample.skills,
    projects: sample.projects,
    certifications: sample.certifications,
  });
  res.status(201).json(resume);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  res.json(resume);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });

  const plan = req.user.subscription?.plan || 'free';
  let switchedTemplate = null;

  // Only a genuine switch (a different slug than what's already stored)
  // should re-validate against the plan — autosave always resends the
  // resume's current templateSlug verbatim, and re-checking that on every
  // save would incorrectly lock a user out of their own resume the moment
  // they downgrade below whatever template it already uses.
  if (req.body.templateSlug && req.body.templateSlug !== resume.templateSlug) {
    const template = await Template.findOne({ slug: req.body.templateSlug });
    if (!template) {
      return res.status(404).json({ message: 'Unknown template' });
    }
    if (!userCanUseTemplate(plan, template)) {
      return res.status(403).json({ message: 'Template locked. Upgrade your plan.' });
    }
    resume.templateSlug = template.slug;
    resume.templateId = template._id;
    switchedTemplate = template;
  }

  if (req.body.theme) {
    const activeTemplate =
      switchedTemplate ||
      (resume.templateId
        ? await Template.findById(resume.templateId)
        : await Template.findOne({ slug: resume.templateSlug }));

    if (isThemeCustomized(req.body.theme, activeTemplate?.defaultTheme) && !userCanCustomizeColors(plan)) {
      return res.status(403).json({
        message: 'Color customization requires Pro plan or higher',
      });
    }
    resume.theme = { ...(resume.theme?.toObject?.() || resume.theme), ...req.body.theme };
  }

  const allowed = [
    'title', 'personal', 'summary', 'education', 'experience',
    'skills', 'projects', 'certifications', 'sectionOrder', 'isPublic',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) resume[key] = req.body[key];
  });

  resume.lastAutoSavedAt = new Date();
  await resume.save();
  res.json(resume);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const resume = await Resume.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  await ResumeVersion.deleteMany({ resume: req.params.id });
  // Unlink rather than cascade-delete: a cover letter is separately authored
  // content (the user's own writing), not a derived artifact of the resume
  // it was originally created from — deleting the resume shouldn't silently
  // destroy it too. The letter keeps existing normally, it just stops
  // showing a "For: <resume>" link (see coverLetterRoutes.js's populate on
  // the list endpoint, which already tolerates a null resume gracefully).
  await CoverLetter.updateMany({ resume: req.params.id }, { $set: { resume: null } });
  res.json({ message: 'Resume deleted' });
}));

router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const source = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!source) return res.status(404).json({ message: 'Resume not found' });
  const snap = resumeSnapshot(source);
  const copy = await Resume.create({
    ...snap,
    user: req.user._id,
    title: req.body.title || `${source.title} (Copy)`,
    isPublic: false,
    shareToken: undefined,
  });
  res.status(201).json(copy);
}));

router.get('/:id/versions', asyncHandler(async (req, res) => {
  const versions = await ResumeVersion.find({
    resume: req.params.id,
    user: req.user._id,
  }).sort({ createdAt: -1 });
  res.json(versions);
}));

router.post('/:id/versions', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const version = await ResumeVersion.create({
    resume: resume._id,
    user: req.user._id,
    name: req.body.name || `Version ${new Date().toLocaleString()}`,
    snapshot: resumeSnapshot(resume),
  });
  res.status(201).json(version);
}));

router.post('/:id/versions/:versionId/restore', asyncHandler(async (req, res) => {
  const version = await ResumeVersion.findOne({
    _id: req.params.versionId,
    resume: req.params.id,
    user: req.user._id,
  });
  if (!version) return res.status(404).json({ message: 'Version not found' });
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  Object.assign(resume, version.snapshot);
  await resume.save();
  res.json(resume);
}));

router.post('/:id/ats-check', asyncHandler(async (req, res) => {
  const plan = req.user.subscription?.plan || 'free';
  if (!['pro', 'premium'].includes(plan)) {
    return res.status(403).json({ message: 'ATS checker requires Pro plan or higher' });
  }
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  res.json(analyzeResume(resume));
}));

router.post('/:id/share', asyncHandler(async (req, res) => {
  const plan = req.user.subscription?.plan || 'free';
  if (plan !== 'premium') {
    return res.status(403).json({ message: 'Share link requires Premium plan' });
  }
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  resume.isPublic = true;
  await resume.save();
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  res.json({ shareUrl: `${base}/share/${resume.shareToken}` });
}));

router.post('/:id/docx', exportLimiter, asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const buffer = await buildResumeDocx(resume);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${(resume.title || 'resume').replace(/\s+/g, '-')}.docx"`
  );
  res.send(buffer);

  // Fire-and-forget: never let analytics logging affect the export response.
  AnalyticsEvent.create({ resume: resume._id, type: 'download', format: 'docx' }).catch((err) =>
    console.error('Analytics download tracking failed:', err)
  );
}));

// Real, native-text PDF via a headless-browser render of the print-CSS
// route (see pdfService.js) — not a screenshot. Rate-limited like docx:
// launching a browser per request is the most expensive export we offer.
router.post('/:id/pdf', exportLimiter, asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id }).select('_id title');
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const buffer = await generateResumePdf(resume._id, req.user._id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${(resume.title || 'resume').replace(/\s+/g, '-')}.pdf"`
  );
  res.send(buffer);

  AnalyticsEvent.create({ resume: resume._id, type: 'download', format: 'pdf' }).catch((err) =>
    console.error('Analytics download tracking failed:', err)
  );
}));

// Called when the Builder is exited back to the Dashboard, where thumbnails
// are actually shown — not on every autosave, which would launch a browser
// far too often. Same Puppeteer-per-request cost as PDF/DOCX export, so
// shares its rate limiter; the recency check below additionally guards
// against a user quickly bouncing in and out of the Builder.
// Fire-and-forget like the analytics logging above: the caller doesn't wait
// on this either, so respond immediately and do the actual render/upload/
// save after, rather than holding the connection open across a Puppeteer run.
router.post('/:id/thumbnail', exportLimiter, asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id })
    .select('_id thumbnailGeneratedAt');
  if (!resume) return res.status(404).json({ message: 'Resume not found' });

  if (!shouldRegenerateThumbnail(resume)) {
    return res.status(204).end();
  }

  res.status(202).end();
  (async () => {
    const buffer = await generateResumeThumbnail(resume._id, req.user._id);
    const url = await saveResumeThumbnail(buffer);
    await Resume.findByIdAndUpdate(resume._id, {
      thumbnailUrl: url,
      thumbnailGeneratedAt: new Date(),
    });
  })().catch((err) => console.error('Thumbnail generation failed:', err));
}));

// PNG export happens entirely client-side (html-to-image) — no server
// round-trip occurs for it, so the frontend calls this directly after a
// successful export to log the download. PDF now generates server-side
// (see /:id/pdf above) and logs its own analytics event directly.
router.post('/:id/track-download', asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id }).select('_id');
  if (!resume) return res.status(404).json({ message: 'Resume not found' });
  const format = req.body.format === 'png' ? 'png' : undefined;
  await AnalyticsEvent.create({ resume: resume._id, type: 'download', format });
  res.status(201).json({ ok: true });
}));

router.get('/:id/analytics', asyncHandler(async (req, res) => {
  const plan = req.user.subscription?.plan || 'free';
  if (!['pro', 'premium'].includes(plan)) {
    return res.status(403).json({ message: 'Resume analytics requires Pro plan or higher' });
  }

  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id }).select('_id');
  if (!resume) return res.status(404).json({ message: 'Resume not found' });

  const DAYS = 30;
  const since = timelineStartDate(DAYS);

  const [totalViews, totalDownloads, recentEvents] = await Promise.all([
    AnalyticsEvent.countDocuments({ resume: resume._id, type: 'view' }),
    AnalyticsEvent.countDocuments({ resume: resume._id, type: 'download' }),
    AnalyticsEvent.find({ resume: resume._id, createdAt: { $gte: since } }).select('type createdAt'),
  ]);

  res.json({
    totalViews,
    totalDownloads,
    timeline: buildDailyTimeline(recentEvents, DAYS),
  });
}));

export default router;
