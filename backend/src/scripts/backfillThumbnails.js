import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Resume from '../models/Resume.js';
import { connectDB } from '../config/db.js';
import { generateResumeThumbnail, saveResumeThumbnail } from '../services/thumbnailService.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

/**
 * One-time backfill for the local-thumbnail-storage incident: finds every
 * resume whose thumbnailUrl points at a local /uploads file that no longer
 * exists on disk (a correct DB reference to a since-deleted file) and
 * regenerates a real thumbnail for it via the same Puppeteer pipeline
 * Builder-exit uses. Only touches resumes with a genuinely missing file —
 * safe to re-run; anything already intact (or stored on Cloudinary) is left
 * untouched.
 *
 * Requires the frontend dev server (or whatever FRONTEND_URL points at) to
 * be reachable, since generateResumeThumbnail navigates to its print route.
 */
const run = async () => {
  await connectDB();

  const diskFiles = new Set(fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : []);
  const candidates = await Resume.find({ thumbnailUrl: { $regex: '^/uploads/' } }).select('_id user title thumbnailUrl');

  const broken = candidates.filter((r) => !diskFiles.has(r.thumbnailUrl.replace('/uploads/', '')));

  console.log(`Scanned ${candidates.length} resumes with a local thumbnailUrl.`);
  console.log(`Found ${broken.length} whose file is missing on disk.\n`);

  let succeeded = 0;
  let failed = 0;
  for (const resume of broken) {
    try {
      const buffer = await generateResumeThumbnail(resume._id, resume.user);
      const url = await saveResumeThumbnail(buffer);
      await Resume.findByIdAndUpdate(resume._id, { thumbnailUrl: url, thumbnailGeneratedAt: new Date() });
      succeeded++;
      console.log(`  OK   ${resume._id}  ${resume.title}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL ${resume._id}  ${resume.title}: ${err.message}`);
    }
  }

  console.log(`\nBackfill complete: ${succeeded} regenerated, ${failed} failed, out of ${broken.length} broken (${candidates.length} scanned).`);
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
