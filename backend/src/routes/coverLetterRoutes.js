import express from 'express';
import CoverLetter from '../models/CoverLetter.js';
import CoverLetterVersion from '../models/CoverLetterVersion.js';
import Resume from '../models/Resume.js';
import { protect } from '../middleware/auth.js';
import { getSampleCoverLetterPayload } from '../utils/sampleResumeData.js';
import { buildCoverLetterDocx } from '../services/docxService.js';
import { generateCoverLetterPdf } from '../services/coverLetterPdfService.js';
import { exportLimiter } from '../middleware/security.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();
router.use(protect);

// Content-Disposition is a raw HTTP header, so its value has to be plain
// ASCII — Node's http module throws ERR_INVALID_CHAR on anything outside
// that range (e.g. the default sample title's em dash, "Cover Letter —
// Software Engineer", crashed the PDF route entirely before this existed).
// Strips whatever doesn't fit rather than percent/RFC-5987-encoding it,
// since a slightly simplified filename is a fine trade for never 500ing.
const safeAttachmentFilename = (title, fallback = 'cover-letter') =>
  (title || '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '') || fallback;

// Mirrors resumeRoutes.js's resumeSnapshot exactly, including stripping
// shareToken/isPublic so a duplicate never inherits the original's public
// sharing state. `resume` (the linked-resume reference) is deliberately
// kept, not stripped — a duplicate is a copy of the whole document, so it
// stays "for" the same resume as the original until the user changes it.
const coverLetterSnapshot = (doc) => {
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

const requirePremium = (req, res, next) => {
  if (req.user.subscription?.plan !== 'premium') {
    return res.status(403).json({ message: 'Cover letters require Premium plan' });
  }
  next();
};

router.use(requirePremium);

router.get('/', asyncHandler(async (req, res) => {
  const letters = await CoverLetter.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .populate('resume', 'title');
  res.json(letters);
}));

router.post('/', asyncHandler(async (req, res) => {
  const sample = getSampleCoverLetterPayload();
  let personal = sample.personal || {};
  let theme;
  let templateSlug = 'classic-blue';

  if (req.body.resumeId) {
    const resume = await Resume.findOne({ _id: req.body.resumeId, user: req.user._id });
    if (resume) {
      personal = {
        fullName: resume.personal?.fullName || '',
        email: resume.personal?.email || '',
        phone: resume.personal?.phone || '',
        location: resume.personal?.location || '',
      };
      theme = resume.theme;
      templateSlug = resume.templateSlug;
    }
  }

  const letter = await CoverLetter.create({
    user: req.user._id,
    resume: req.body.resumeId || null,
    title: req.body.title || sample.title,
    templateSlug,
    theme,
    personal,
    recipientName: sample.recipientName,
    recipientTitle: sample.recipientTitle,
    companyName: sample.companyName,
    companyAddress: sample.companyAddress,
    date: sample.date,
    salutation: sample.salutation,
    body: req.body.withSample !== false ? sample.body : '',
    closing: sample.closing,
  });
  res.status(201).json(letter);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!letter) return res.status(404).json({ message: 'Not found' });
  res.json(letter);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!letter) return res.status(404).json({ message: 'Not found' });
  const fields = [
    'title', 'templateSlug', 'theme', 'personal', 'recipientName', 'recipientTitle',
    'companyName', 'companyAddress', 'date', 'salutation', 'body', 'closing', 'resume',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) letter[f] = req.body[f];
  });
  await letter.save();
  res.json(letter);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await CoverLetter.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  await CoverLetterVersion.deleteMany({ coverLetter: req.params.id });
  res.json({ message: 'Deleted' });
}));

router.post('/:id/duplicate', asyncHandler(async (req, res) => {
  const source = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!source) return res.status(404).json({ message: 'Not found' });
  const snap = coverLetterSnapshot(source);
  const copy = await CoverLetter.create({
    ...snap,
    user: req.user._id,
    title: req.body.title || `${source.title} (Copy)`,
    isPublic: false,
    shareToken: undefined,
  });
  res.status(201).json(copy);
}));

router.get('/:id/versions', asyncHandler(async (req, res) => {
  const versions = await CoverLetterVersion.find({
    coverLetter: req.params.id,
    user: req.user._id,
  }).sort({ createdAt: -1 });
  res.json(versions);
}));

router.post('/:id/versions', asyncHandler(async (req, res) => {
  const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!letter) return res.status(404).json({ message: 'Not found' });
  const version = await CoverLetterVersion.create({
    coverLetter: letter._id,
    user: req.user._id,
    name: req.body.name || `Version ${new Date().toLocaleString()}`,
    snapshot: coverLetterSnapshot(letter),
  });
  res.status(201).json(version);
}));

router.post('/:id/versions/:versionId/restore', asyncHandler(async (req, res) => {
  const version = await CoverLetterVersion.findOne({
    _id: req.params.versionId,
    coverLetter: req.params.id,
    user: req.user._id,
  });
  if (!version) return res.status(404).json({ message: 'Version not found' });
  const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id });
  Object.assign(letter, version.snapshot);
  await letter.save();
  res.json(letter);
}));

// Mirrors resumeRoutes.js's POST /:id/share exactly — no separate plan
// check needed here (unlike Resume's, which gates Premium inline) since
// requirePremium above already applies to every route in this file.
router.post('/:id/share', asyncHandler(async (req, res) => {
  const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!letter) return res.status(404).json({ message: 'Not found' });
  letter.isPublic = true;
  await letter.save();
  const base = process.env.CLIENT_URL || 'http://localhost:5173';
  res.json({ shareUrl: `${base}/share/cover-letter/${letter.shareToken}` });
}));

router.post('/:id/docx', exportLimiter, asyncHandler(async (req, res) => {
  const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id });
  if (!letter) return res.status(404).json({ message: 'Not found' });
  const buffer = await buildCoverLetterDocx(letter);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename="cover-letter.docx"`);
  res.send(buffer);
}));

router.post('/:id/pdf', exportLimiter, asyncHandler(async (req, res) => {
  const letter = await CoverLetter.findOne({ _id: req.params.id, user: req.user._id }).select('_id title');
  if (!letter) return res.status(404).json({ message: 'Not found' });
  const buffer = await generateCoverLetterPdf(letter._id, req.user._id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeAttachmentFilename(letter.title)}.pdf"`);
  res.send(buffer);
}));

export default router;
