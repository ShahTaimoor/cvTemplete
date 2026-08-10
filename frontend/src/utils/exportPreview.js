import { toCanvas, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
/** Ignore sub-mm overflow from capture rounding (prevents blank trailing page) */
const PAGE_HEIGHT_TOLERANCE_MM = 3;

function getCaptureBackground(element) {
  const root = element?.closest?.('[data-print-root]') || element;
  const fromAttr = root?.dataset?.resumeBg;
  if (fromAttr) return fromAttr;
  const inner = element.querySelector?.('[style*="background"]') || element.firstElementChild;
  if (inner) {
    const bg = getComputedStyle(inner).backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
  }
  return '#ffffff';
}

const captureOptions = (element) => ({
  pixelRatio: 3,
  backgroundColor: getCaptureBackground(element),
  cacheBust: true,
  width: element.scrollWidth,
  height: element.scrollHeight,
  style: {
    margin: '0',
    transform: 'none',
  },
});

async function captureToCanvas(element) {
  return toCanvas(element, captureOptions(element));
}

function addPdfPagesFromCanvas(pdf, canvas, imgData, element) {
  const pageWidth = A4_WIDTH_MM;
  const pageHeight = A4_HEIGHT_MM;
  let imgWidth = pageWidth;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Single A4 page (scale down slightly if capture is a few mm taller than 297mm)
  if (imgHeight <= pageHeight + PAGE_HEIGHT_TOLERANCE_MM) {
    if (imgHeight > pageHeight) {
      const scale = pageHeight / imgHeight;
      imgWidth *= scale;
      imgHeight = pageHeight;
    }
    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    return;
  }

  // Multi-page: slice the canvas per A4 page (no duplicate blank page)
  const pageHeightPx = Math.floor((pageHeight * canvas.width) / imgWidth);
  let offsetY = 0;
  let pageIndex = 0;

  const sliceCanvas = document.createElement('canvas');
  const sliceCtx = sliceCanvas.getContext('2d');
  sliceCanvas.width = canvas.width;

  while (offsetY < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - offsetY);
    sliceCanvas.height = sliceHeightPx;

    sliceCtx.fillStyle = getCaptureBackground(element);
    sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    sliceCtx.drawImage(
      canvas,
      0,
      offsetY,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );

    const sliceMm = (sliceHeightPx * imgWidth) / canvas.width;
    const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.97);

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(sliceData, 'JPEG', 0, 0, imgWidth, sliceMm);

    offsetY += sliceHeightPx;
    pageIndex += 1;
  }
}

/**
 * Capture a DOM element and save as PDF (matches on-screen preview).
 */
export async function exportElementToPdf(element, filename = 'resume.pdf') {
  if (!element) throw new Error('Preview element not found');

  const canvas = await captureToCanvas(element);
  const imgData = canvas.toDataURL('image/jpeg', 0.97);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addPdfPagesFromCanvas(pdf, canvas, imgData, element);
  pdf.save(filename);
}

/**
 * Capture element as PNG download.
 */
export async function exportElementToPng(element, filename = 'resume.png') {
  if (!element) throw new Error('Preview element not found');

  const dataUrl = await toPng(element, captureOptions(element));

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
