import { launchPrintPage } from './printBrowser.js';

/**
 * Renders a cover letter to a real, native-text PDF via the same headless-
 * browser pipeline used for resumes (see pdfService.js): navigates to the
 * standalone /print/cover-letter/:id route (print-CSS-driven, natural
 * document flow — see CoverLetterPrintPage.jsx) and lets Chromium's own PDF
 * engine paginate it. No screenshots involved, so the resulting PDF has
 * real, selectable, searchable text.
 *
 * Deliberately skips the auto-fill-scale step pdfService.js applies for
 * resumes — that's a resume-specific "make a short one-pager look
 * deliberate" concern (63 template layouts, wildly varying content
 * density); a cover letter is a single flowing letter, short by
 * convention, and doesn't need it.
 */
export async function generateCoverLetterPdf(letterId, userId) {
  const { browser, page } = await launchPrintPage(letterId, userId, { width: 900, height: 1200 }, 'cover-letter');
  try {
    // Puppeteer's page.pdf() returns a Uint8Array, not a Node Buffer — and
    // Express's res.send() only recognizes a true Buffer as binary; given
    // anything else, it silently falls through to res.json(), which mangles
    // the PDF into a numeric-keyed JSON object instead of sending raw bytes.
    const pdfBytes = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
