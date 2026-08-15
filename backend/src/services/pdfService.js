import puppeteer from 'puppeteer';
import { createPrintToken } from '../utils/printToken.js';

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Renders a resume to a real, native-text PDF via a headless browser: signs
 * a short-lived print token, navigates to the standalone /print/resume/:id
 * route (print-CSS-driven, natural document flow — see PrintPage.jsx), and
 * lets Chromium's own PDF engine paginate it. No screenshots involved, so
 * the resulting PDF has real, selectable, searchable text.
 *
 * waitUntil is deliberately 'domcontentloaded', not 'networkidle0' — the
 * frontend dev server keeps a persistent HMR websocket open, which would
 * make networkidle0 hang until its own timeout. Readiness is instead
 * signaled explicitly via the data-print-ready attribute (also set once
 * fonts have had time to apply), which is what actually determines when
 * the page is safe to print.
 */
export async function generateResumePdf(resumeId, userId) {
  const token = createPrintToken(userId, resumeId);
  const url = `${FRONTEND_URL}/print/resume/${resumeId}?token=${token}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-print-ready="true"]', { timeout: 20000 });
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
