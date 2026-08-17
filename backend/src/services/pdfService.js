import { launchPrintPage } from './printBrowser.js';

// Auto-fill scaling: a resume that naturally leaves a single A4 page mostly
// blank gets its font-size/line-height/spacing bumped up proportionally so
// it reads as a deliberately-designed one-pager instead of a short document
// floating in empty space. Only kicks in within a narrow band — see the
// three constants below — never for anything that's already 2+ pages.
const FILL_THRESHOLD = 0.85; // don't touch content already filling ≥85% of the page
const MAX_SCALE = 1.15; // ceiling — past this, accept leftover blank space rather than stretch text unnaturally
const TARGET_FILL = 0.96; // aim just under full height, not exactly to the pixel
const BACKOFF_STEP = 0.02;

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
  // Wide enough that the fixed 210mm-wide print root never gets squeezed by
  // a narrower default viewport before we measure it.
  const { browser, page } = await launchPrintPage(resumeId, userId, { width: 900, height: 1200 });
  try {
    await applyAutoFillScale(page);

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

/**
 * Measures the print root against a genuine 297mm reference (rather than a
 * hardcoded mm→px constant) so the threshold is exact for whatever DPI this
 * specific Chromium build uses, decides whether the resume qualifies for
 * auto-fill scaling, and if so applies it via a --print-scale CSS custom
 * property on <html>.
 *
 * The scale is a content-density adjustment, not `transform: scale()` on
 * the page — a transform would stretch the fixed 210mm page width too.
 * Instead PrintPage.jsx's inner content wrapper pairs
 * `width: calc(210mm / scale)` with `zoom: scale`: zoom (unlike transform)
 * participates in layout, so the box's own contribution back out to its
 * unscaled ancestor is exactly `(210mm / scale) * scale === 210mm` — the
 * page width never moves, only the content inside renders bigger.
 */
async function applyAutoFillScale(page) {
  const { contentHeight, pageHeight } = await page.evaluate(() => {
    const ref = document.createElement('div');
    ref.style.cssText = 'position:absolute;visibility:hidden;height:297mm;width:0;';
    document.body.appendChild(ref);
    const measuredPageHeight = ref.getBoundingClientRect().height;
    document.body.removeChild(ref);
    return {
      contentHeight: document.getElementById('print-page-root').scrollHeight,
      pageHeight: measuredPageHeight,
    };
  });

  const fillRatio = contentHeight / pageHeight;

  // Already fills most of the page, or spans 2+ pages outright — leave untouched.
  if (contentHeight > pageHeight * FILL_THRESHOLD || contentHeight <= 0) {
    console.log(`PDF auto-fill: content=${Math.round(contentHeight)}px page=${Math.round(pageHeight)}px fill=${(fillRatio * 100).toFixed(0)}% — no scaling (already ≥${FILL_THRESHOLD * 100}% full or multi-page)`);
    return;
  }

  let scale = Math.min(MAX_SCALE, (pageHeight * TARGET_FILL) / contentHeight);
  if (scale <= 1.001) {
    console.log(`PDF auto-fill: content=${Math.round(contentHeight)}px page=${Math.round(pageHeight)}px fill=${(fillRatio * 100).toFixed(0)}% — computed scale ~1.0, skipping`);
    return;
  }

  await setScale(page, scale);

  // Re-measure — text reflow at a larger size doesn't scale height perfectly
  // linearly (line-wrap points can shift), so confirm it still fits on one
  // page and back off in small steps if it doesn't, rather than trusting
  // the first estimate.
  let scaledHeight = await page.evaluate(
    () => document.getElementById('print-page-root').scrollHeight
  );
  while (scaledHeight > pageHeight * TARGET_FILL && scale > 1.001) {
    scale = Math.max(1, scale - BACKOFF_STEP);
    await setScale(page, scale);
    scaledHeight = await page.evaluate(
      () => document.getElementById('print-page-root').scrollHeight
    );
  }

  console.log(`PDF auto-fill: content=${Math.round(contentHeight)}px page=${Math.round(pageHeight)}px fill=${(fillRatio * 100).toFixed(0)}% — scaled ${scale.toFixed(3)}x, final height=${Math.round(scaledHeight)}px`);
}

function setScale(page, scale) {
  return page.evaluate((s) => {
    document.documentElement.style.setProperty('--print-scale', s);
  }, scale);
}
