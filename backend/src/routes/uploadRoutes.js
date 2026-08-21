import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { protect } from '../middleware/auth.js';
import { uploadImage, isCloudinaryConfigured } from '../services/cloudinaryService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// The only types this endpoint accepts. Each entry maps a reported
// Content-Type to a fixed extension and a magic-byte check used to verify
// the file's *actual* content after upload — the reported mimetype alone is
// client-supplied and not trustworthy.
const ALLOWED_TYPES = {
  'image/jpeg': {
    ext: '.jpg',
    magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  'image/png': {
    ext: '.png',
    magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  'image/gif': {
    ext: '.gif',
    magic: (b) => b.toString('ascii', 0, 3) === 'GIF',
  },
  'image/webp': {
    ext: '.webp',
    magic: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP',
  },
};

// Reads the first few bytes actually written to disk and checks them against
// the known signatures above. Returns null if the content doesn't match any
// allowed image type, regardless of what the upload claimed to be.
const detectRealImageType = (filePath) => {
  const buffer = Buffer.alloc(16);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buffer, 0, 16, 0);
  } finally {
    fs.closeSync(fd);
  }
  return Object.keys(ALLOWED_TYPES).find((type) => ALLOWED_TYPES[type].magic(buffer)) || null;
};

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_req, file, cb) => {
    // Never build the destination filename from client input. The original
    // filename (file.originalname) is fully attacker-controlled — a name
    // like "../../../../etc/whatever" would otherwise be written straight
    // into the path. Generate a fresh random name instead, with an
    // extension taken only from our own allowlist (fileFilter below has
    // already guaranteed file.mimetype is one of ALLOWED_TYPES by the time
    // this runs).
    const ext = ALLOWED_TYPES[file.mimetype]?.ext || '';
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES[file.mimetype]) cb(null, true);
    else cb(new Error('Only JPEG, PNG, GIF, or WEBP images are allowed'));
  },
});

const router = express.Router();

router.post('/photo', protect, upload.single('photo'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // fileFilter only checked the client-reported Content-Type. Verify the
  // bytes actually on disk are a real image of an allowed type before doing
  // anything else with the file (e.g. before ever handing it to Cloudinary
  // or serving it back from /uploads).
  const realType = detectRealImageType(req.file.path);
  if (!realType) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'File content does not match an allowed image type' });
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
}));

export default router;
