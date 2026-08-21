/**
 * Windowed page numbers with ellipses, e.g. [1, '…', 4, 5, 6, '…', 15].
 * Extracted from TemplateGallery.jsx (its original home) so ResumesPage.jsx
 * and CoverLettersPage.jsx can reuse the exact same numbered-pagination
 * pattern instead of each re-deriving it.
 */
export function getPageNumbers(current, total) {
  const delta = 1;
  const range = [];
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i);
  }
  const pages = [1];
  if (range[0] > 2) pages.push('…');
  pages.push(...range);
  if (range[range.length - 1] < total - 1) pages.push('…');
  if (total > 1) pages.push(total);
  return pages;
}
