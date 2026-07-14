import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/auth.js';
import { uploadImage, isCloudinaryConfigured } from '../services/cloudinaryService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'));
  },
});

const router = express.Router();

router.post('/photo', protect, upload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    if (isCloudinaryConfigured()) {
      const url = await uploadImage(req.file.path);
      fs.unlinkSync(req.file.path);
      return res.json({ url });
    }
    const localUrl = `/uploads/${req.file.filename}`;
    res.json({ url: localUrl, note: 'Local storage — configure Cloudinary for production' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
