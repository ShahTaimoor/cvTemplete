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

// Per-document in-flight guard, keyed by `${ModelName}:${id}` (not just
// `id` — Resume and CoverLetter are separate collections, so their _ids
// can collide) — prevents two overlapping Puppeteer launches for the same
// document. Needed now that generation can be kicked off from several
// places for the same doc in quick succession: the direct POST
// /:id/thumbnail route, and the opportunistic fulfillIfDue check below,
// which runs on every list/detail GET — without this, a client polling
// GET /:id every couple of seconds while a generation is in flight could
// trigger a second (or third) concurrent one for the same document.
const inFlight = new Set();

/**
 * Generates and persists a thumbnail for one document, deduped against
 * concurrent calls for the same doc. Shared by both the immediate path
 * (POST /:id/thumbnail, when outside the cooldown) and the deferred path
 * (fulfillIfDue below) — `generateFn` is generateResumeThumbnail or
 * generateCoverLetterThumbnail, `Model` is the Resume or CoverLetter
 * model. Clears thumbnailPending unconditionally on success, since a
 * fresh generation satisfies any deferred request that was waiting on it.
 */
export async function generateAndSaveThumbnail(Model, doc, userId, generateFn) {
  const key = `${Model.modelName}:${doc._id}`;
  if (inFlight.has(key)) return;
  inFlight.add(key);
  try {
    const buffer = await generateFn(doc._id, userId);
    const url = await saveThumbnail(buffer);
    await Model.findByIdAndUpdate(doc._id, {
      thumbnailUrl: url,
      thumbnailGeneratedAt: new Date(),
      thumbnailPending: false,
    });
  } finally {
    inFlight.delete(key);
  }
}

/**
 * Opportunistic fulfillment of a deferred regeneration: called (fire-and-
 * forget, after the response is already sent) from every list/detail GET
 * in resumeRoutes.js / coverLetterRoutes.js. A no-op for the vast majority
 * of documents (thumbnailPending is false), so it's cheap to call
 * unconditionally rather than only on routes we know might need it. This
 * is the actual fix for the bug where a regeneration requested inside the
 * cooldown window used to just be silently dropped — the client's own
 * subsequent polling (see ResumesPage.jsx / CoverLettersPage.jsx's
 * watchThumbnail) already re-fetches the document repeatedly, so it
 * naturally becomes the trigger that eventually satisfies the deferred
 * request once the cooldown has passed, with no dedicated background job.
 */
export function fulfillIfDue(Model, doc, userId, generateFn) {
  if (!doc.thumbnailPending) return;
  if (!shouldRegenerateThumbnail(doc)) return; // still within the cooldown
  generateAndSaveThumbnail(Model, doc, userId, generateFn).catch((err) =>
    console.error('Deferred thumbnail generation failed:', err)
  );
}

export async function generateResumeThumbnail(resumeId, userId) {
  return captureThumbnail(resumeId, userId, 'resume');
}

// Same pipeline as generateResumeThumbnail, driving the /print/cover-letter
// route instead (see printBrowser.js's PRINT_TARGETS and
// coverLetterPdfService.js, which already uses `kind: 'cover-letter'` for
// the PDF-export version of this same page).
export async function generateCoverLetterThumbnail(letterId, userId) {
  return captureThumbnail(letterId, userId, 'cover-letter');
}

/**
 * Renders the same print-CSS page used for PDF export (see pdfService.js /
 * coverLetterPdfService.js / printBrowser.js), but captures a small PNG of
 * just the first page instead of a full paginated PDF — this is a
 * Dashboard card preview, not an export. Shared by both content types
 * above; `kind` is the only thing that differs between them.
 *
 * The print root's box is measured once at deviceScaleFactor 1 to get its
 * true CSS-pixel size (a 210mm x 297mm page), then the viewport is re-set
 * with a deviceScaleFactor chosen so the *rasterized* screenshot comes out
 * ~THUMB_WIDTH px wide — Chromium multiplies clip dimensions (in CSS px) by
 * the device scale factor when producing the actual image, so this shrinks
 * the output image itself rather than requiring a separate resize step.
 * Clipping to exactly one page's height also naturally takes care of
 * "first page only" for resumes that spill onto a second page (a cover
 * letter is always a single flowing page, so for it this is simply "the
 * whole letter").
 */
async function captureThumbnail(resourceId, userId, kind) {
  const { browser, page } = await launchPrintPage(resourceId, userId, { width: 900, height: 1200 }, kind);
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
// and cleaned up when it is. Generic over content type — nothing here is
// resume-specific, so both generateResumeThumbnail and
// generateCoverLetterThumbnail's output goes through this same save step.
export async function saveThumbnail(buffer) {
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
