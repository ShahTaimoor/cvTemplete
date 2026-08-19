import puppeteer from 'puppeteer';
import { createPrintToken, createCoverLetterPrintToken } from '../utils/printToken.js';

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';

// One entry per print-CSS target route this pipeline can drive Puppeteer
// to — add a new pair here (not a new launch function) for any future
// document type that wants this same real-text-PDF approach.
const PRINT_TARGETS = {
  resume: { path: (id) => `/print/resume/${id}`, createToken: createPrintToken },
  'cover-letter': { path: (id) => `/print/cover-letter/${id}`, createToken: createCoverLetterPrintToken },
};

/**
 * Shared entry point into the print-CSS rendering pipeline (see
 * PrintPage.jsx / CoverLetterPrintPage.jsx): signs a short-lived print
 * token, launches a headless browser, and navigates to the standalone
 * /print/<kind>/:id route, waiting for it to signal readiness. Used by PDF
 * export (pdfService.js, coverLetterPdfService.js) and thumbnail
 * generation (thumbnailService.js) — callers own the returned browser and
 * must close it themselves (in a finally) once they're done capturing
 * output from `page`.
 *
 * `kind` defaults to 'resume' so every existing call site (which predates
 * this parameter) keeps behaving exactly as before without being touched.
 *
 * waitUntil is deliberately 'domcontentloaded', not 'networkidle0' — the
 * frontend dev server keeps a persistent HMR websocket open, which would
 * make networkidle0 hang until its own timeout. Readiness is instead
 * signaled explicitly via the data-print-ready attribute (also set once
 * fonts have had time to apply), which is what actually determines when
 * the page is safe to capture.
 */
export async function launchPrintPage(resourceId, userId, viewport, kind = 'resume') {
  const target = PRINT_TARGETS[kind];
  const token = target.createToken(userId, resourceId);
  const url = `${FRONTEND_URL}${target.path(resourceId)}?token=${token}`;

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
