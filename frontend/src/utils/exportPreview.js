import { toPng } from 'html-to-image';

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
