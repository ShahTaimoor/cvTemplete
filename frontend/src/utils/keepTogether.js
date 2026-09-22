// Page-break control for resumes that are cut into fixed-height A4 pages.
// Blocks marked data-keep-together are never split across a page boundary:
// one that would straddle it is pushed whole onto the next page. Section
// titles (data-keep-with-next) are pushed too when there isn't room under
// them for some content, so a heading is never stranded at the page bottom.
//
// Positions are measured on `ref` (real, flowing layout). The same margin is
// then applied to the matching blocks in `others`, which render identical
// content (the visible page copies) and so line up node for node.

const SELECTOR = '[data-keep-together], [data-keep-with-next]';
const PAD = 'data-kt-pad';
const ORIG = 'data-kt-orig';
const HEADING_ROOM_PX = 56;
const MAX_KEEPABLE = 0.9; // a block taller than this can't sensibly be moved whole

const resetPads = (root) => {
  root.querySelectorAll(`[${PAD}]`).forEach((n) => {
    n.style.marginTop = n.getAttribute(ORIG) || '';
    n.removeAttribute(PAD);
    n.removeAttribute(ORIG);
  });
};

const addMarginTop = (node, px) => {
  if (!node.hasAttribute(PAD)) {
    node.setAttribute(PAD, '');
    node.setAttribute(ORIG, node.style.marginTop);
  }
  const current = parseFloat(getComputedStyle(node).marginTop) || 0;
  node.style.marginTop = `${current + px}px`;
};

const mirrorMarginTop = (target, source) => {
  if (!target.hasAttribute(PAD)) {
    target.setAttribute(PAD, '');
    target.setAttribute(ORIG, target.style.marginTop);
  }
  target.style.marginTop = source.style.marginTop;
};

export function applyKeepTogether(ref, others, pageHeightPx) {
  if (!ref || !(pageHeightPx > 0)) return;
  const copies = others.filter(Boolean);
  [ref, ...copies].forEach(resetPads);

  const refNodes = [...ref.querySelectorAll(SELECTOR)];
  const copyNodes = copies.map((c) => [...c.querySelectorAll(SELECTOR)]);
  const base = ref.getBoundingClientRect().top;

  refNodes.forEach((node, i) => {
    const rect = node.getBoundingClientRect();
    const top = rect.top - base;
    const needed = node.hasAttribute('data-keep-with-next') ? rect.height + HEADING_ROOM_PX : rect.height;
    const pageIndex = Math.floor((top + 0.5) / pageHeightPx);
    const pageEnd = (pageIndex + 1) * pageHeightPx;
    const atPageStart = top <= pageIndex * pageHeightPx + 1;

    if (atPageStart || top + needed <= pageEnd || rect.height > pageHeightPx * MAX_KEEPABLE) return;

    // Adjacent block margins collapse (max, not sum), so a single margin can
    // land short of the boundary. Re-measure and top up until it's on the
    // next page, then mirror the final margin onto the other copies.
    addMarginTop(node, pageEnd - top);
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const deficit = pageEnd - (node.getBoundingClientRect().top - base);
      if (deficit <= 0.5) break;
      addMarginTop(node, deficit);
    }
    copyNodes.forEach((nodes) => nodes[i] && mirrorMarginTop(nodes[i], node));
  });
}
