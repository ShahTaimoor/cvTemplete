import express from 'express';
import CoverLetter from '../models/CoverLetter.js';
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
  res.json({ message: 'Deleted' });
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
