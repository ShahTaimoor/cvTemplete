import express from 'express';
import Resume from '../models/Resume.js';
import { verifyPrintToken } from '../utils/printToken.js';

const router = express.Router();

router.get('/resume/:id', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(401).json({ message: 'Print token required' });
    const decoded = verifyPrintToken(token, req.params.id);
    const resume = await Resume.findOne({ _id: req.params.id, user: decoded.userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch {
    res.status(401).json({ message: 'Invalid or expired print token' });
  }
});

export default router;
