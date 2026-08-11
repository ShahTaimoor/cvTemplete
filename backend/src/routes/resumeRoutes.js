import express from 'express';
import Resume from '../models/Resume.js';
import ResumeVersion from '../models/ResumeVersion.js';
import Template from '../models/Template.js';
import { protect } from '../middleware/auth.js';
import { userCanUseTemplate, userCanCustomizeColors } from '../utils/templateAccess.js';
import { analyzeResume } from '../services/atsService.js';
import { buildResumeDocx } from '../services/docxService.js';
import { getSampleResumePayload } from '../utils/sampleResumeData.js';
import { exportLimiter } from '../middleware/security.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);

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

router.post('/', asyncHandler(async (req, res) => {
  const slug = req.body.templateSlug || 'classic-blue';
  const template = await Template.findOne({ slug });
  const plan = req.user.subscription?.plan || 'free';

  if (template && !userCanUseTemplate(plan, template)) {
    return res.status(403).json({ message: 'Template locked. Upgrade your plan.' });
  }

  const count = await Resume.countDocuments({ user: req.user._id });
  const useSample = req.body.withSampleData !== false && (count === 0 || req.body.withSampleData === true);
  const sample = useSample ? getSampleResumePayload() : {};

  const resume = await Resume.create({
    user: req.user._id,
    title: req.body.title || sample.title || 'Untitled Resume',
    templateSlug: slug,
    templateId: template?._id,
    theme: template?.defaultTheme || sample.theme,
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

  if (req.body.templateSlug) {
    const template = await Template.findOne({ slug: req.body.templateSlug });
    if (template && !userCanUseTemplate(plan, template)) {
      return res.status(403).json({ message: 'Template locked. Upgrade your plan.' });
    }
    if (template) {
      resume.templateSlug = template.slug;
      resume.templateId = template._id;
    }
  }

  if (req.body.theme) {
    if (!userCanCustomizeColors(plan)) {
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
}));

export default router;
