import puppeteer from 'puppeteer';
import { createPrintToken } from '../utils/printToken.js';

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Shared entry point into the print-CSS rendering pipeline (see
 * PrintPage.jsx): signs a short-lived print token, launches a headless
 * browser, and navigates to the standalone /print/resume/:id route, waiting
 * for it to signal readiness. Used by both PDF export (pdfService.js) and
 * thumbnail generation (thumbnailService.js) — callers own the returned
 * browser and must close it themselves (in a finally) once they're done
 * capturing output from `page`.
 *
 * waitUntil is deliberately 'domcontentloaded', not 'networkidle0' — the
 * frontend dev server keeps a persistent HMR websocket open, which would
 * make networkidle0 hang until its own timeout. Readiness is instead
 * signaled explicitly via the data-print-ready attribute (also set once
 * fonts have had time to apply), which is what actually determines when
 * the page is safe to capture.
 */
export async function launchPrintPage(resumeId, userId, viewport) {
  const token = createPrintToken(userId, resumeId);
  const url = `${FRONTEND_URL}/print/resume/${resumeId}?token=${token}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-print-ready="true"]', { timeout: 20000 });
  return { browser, page };
}
