import express from 'express';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Only our own upload URLs or https links are accepted for the photo.
export const readReviewBody = (body) => {
  const rating = Number(body.rating);
  const data = {
    name: str(body.name, 80),
    role: str(body.role, 80),
    text: str(body.text, 600),
    rating,
    image: str(body.image, 500),
  };
  if (!data.name) return { error: 'Name is required' };
  if (!data.text) return { error: 'Review text is required' };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: 'Rating must be between 1 and 5' };
  }
  if (data.image && !(data.image.startsWith('/uploads/') || data.image.startsWith('https://'))) {
    return { error: 'Invalid image' };
  }
  return { data };
};

// Public: approved reviews for the landing page.
router.get('/', asyncHandler(async (_req, res) => {
  const reviews = await Review.find({ status: 'approved' })
    .sort({ createdAt: -1 })
    .limit(30)
    .select('name role rating text image createdAt');
  res.json({ reviews });
}));

// Logged-in users submit a review; it stays hidden until an admin approves it.
router.post('/', protect, asyncHandler(async (req, res) => {
  const { data, error } = readReviewBody(req.body);
  if (error) return res.status(400).json({ message: error });
  const review = await Review.create({ ...data, user: req.user._id, status: 'pending' });
  res.status(201).json({ review });
}));

export default router;
