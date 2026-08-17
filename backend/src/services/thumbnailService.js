import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { launchPrintPage } from './printBrowser.js';
import { uploadThumbnail, isCloudinaryConfigured } from './cloudinaryService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const THUMB_WIDTH = 300; // target rendered PNG width, in actual (post-DPR) pixels

// Don't regenerate a thumbnail that was just made — handles a user quickly
// bouncing in and out of the Builder repeatedly without spamming Puppeteer.
const THROTTLE_MS = 5 * 60 * 1000;

export function shouldRegenerateThumbnail(resume) {
  if (!resume.thumbnailGeneratedAt) return true;
  return Date.now() - new Date(resume.thumbnailGeneratedAt).getTime() > THROTTLE_MS;
}

/**
 * Renders the same print-CSS page used for PDF export (see pdfService.js /
 * printBrowser.js), but captures a small PNG of just the first page instead
 * of a full paginated PDF — this is a Dashboard card preview, not an export.
 *
 * The print root's box is measured once at deviceScaleFactor 1 to get its
 * true CSS-pixel size (a 210mm x 297mm page), then the viewport is re-set
 * with a deviceScaleFactor chosen so the *rasterized* screenshot comes out
 * ~THUMB_WIDTH px wide — Chromium multiplies clip dimensions (in CSS px) by
 * the device scale factor when producing the actual image, so this shrinks
 * the output image itself rather than requiring a separate resize step.
 * Clipping to exactly one page's height also naturally takes care of
 * "first page only" for resumes that spill onto a second page.
 */
export async function generateResumeThumbnail(resumeId, userId) {
  const { browser, page } = await launchPrintPage(resumeId, userId, { width: 900, height: 1200 });
  try {
    const { cssWidth, cssHeight } = await page.evaluate(() => {
      const ref = document.createElement('div');
      ref.style.cssText = 'position:absolute;visibility:hidden;width:210mm;height:297mm;';
      document.body.appendChild(ref);
      const rect = ref.getBoundingClientRect();
      document.body.removeChild(ref);
      return { cssWidth: rect.width, cssHeight: rect.height };
    });

    await page.setViewport({
      width: Math.ceil(cssWidth),
      height: Math.ceil(cssHeight),
      deviceScaleFactor: THUMB_WIDTH / cssWidth,
    });

    const pngBytes = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: cssWidth, height: cssHeight },
    });
    return Buffer.from(pngBytes);
  } finally {
    await browser.close();
  }
}

// Mirrors the local-file-then-maybe-Cloudinary flow in uploadRoutes.js: the
// buffer is always written to the shared uploads dir first (that path is
// itself the fallback URL when Cloudinary isn't configured), then uploaded
// and cleaned up when it is.
export async function saveResumeThumbnail(buffer) {
  const filename = `thumb-${uuidv4()}.png`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, buffer);

  if (isCloudinaryConfigured()) {
    const url = await uploadThumbnail(filePath);
    fs.unlinkSync(filePath);
    return url;
  }
  return `/uploads/${filename}`;
}
