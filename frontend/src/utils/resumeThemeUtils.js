/** Parse #rgb or #rrggbb to { r, g, b } */
export function parseHexColor(hex) {
  if (!hex || typeof hex !== 'string') return { r: 255, g: 255, b: 255 };
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Subtle card / list block that matches template bg (no white/gray-50 boxes) */
export function getThemedCardStyles(style, emphasis = false) {
  const { r, g, b } = parseHexColor(style?.primary || '#334155');
  const alpha = emphasis ? 0.12 : 0.08;
  const borderAlpha = emphasis ? 0.28 : 0.2;
  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    borderColor: `rgba(${r}, ${g}, ${b}, ${borderAlpha})`,
  };
}

/** Outer frame behind resume (boxed/cards layouts) — tinted, not slate gray */
export function getThemedFrameBg(style) {
  const bg = parseHexColor(style?.bg || '#ffffff');
  const { r, g, b } = parseHexColor(style?.primary || '#334155');
  const mix = 0.06;
  return `rgb(${Math.round(bg.r * (1 - mix) + r * mix)}, ${Math.round(bg.g * (1 - mix) + g * mix)}, ${Math.round(bg.b * (1 - mix) + b * mix)})`;
}

/** Muted band (summary strip, contact strip) */
export function getThemedMutedBandStyle(style) {
  return getThemedCardStyles(style, true);
}
