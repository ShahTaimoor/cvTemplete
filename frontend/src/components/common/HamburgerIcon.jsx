import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

/**
 * Hand-built hamburger <-> X morph: three independent SVG lines that
 * rotate/translate/fade into an X, not two lucide icons (Menu/X) swapping
 * and not a single icon being scaled or rotated as a whole. Drives both the
 * mobile-nav trigger and the drawer's own close control from the same
 * `open` boolean so the two button instances (header vs. inside the drawer
 * panel) always stay in visual sync.
 *
 * Each 16-unit line spans x=4..20 in a 24x24 viewBox, so its own natural
 * center sits at (12, 6)/(12, 12)/(12, 18) — the top/bottom lines rotate
 * around that local center (via an explicit transformOrigin, since SVG's
 * default transform-box is the whole viewport, not each element's own
 * bounding box) and then translate 6 units toward the icon's true center so
 * both converge into a clean X at (12, 12), tilted ±45° from each other.
 */
export default function HamburgerIcon({ open, size = 22, className = '' }) {
  const transition = { duration: DURATION.fast, ease: EASE };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <motion.line
        x1={4} y1={6} x2={20} y2={6}
        style={{ transformOrigin: '12px 6px' }}
        animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
        transition={transition}
      />
      <motion.line
        x1={4} y1={12} x2={20} y2={12}
        animate={open ? { opacity: 0 } : { opacity: 1 }}
        transition={transition}
      />
      <motion.line
        x1={4} y1={18} x2={20} y2={18}
        style={{ transformOrigin: '12px 18px' }}
        animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
        transition={transition}
      />
    </svg>
  );
}
