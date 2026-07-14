import express from 'express';
import Resume from '../models/Resume.js';
import Template from '../models/Template.js';

const router = express.Router();

router.get('/share/:token', async (req, res) => {
  const resume = await Resume.findOne({
    shareToken: req.params.token,
    isPublic: true,
  }).select('-user');
  if (!resume) {
    return res.status(404).json({ message: 'Resume not found or not shared' });
  }
  const template = await Template.findOne({ slug: resume.templateSlug });
  res.json({ resume, template });
});

export default router;
