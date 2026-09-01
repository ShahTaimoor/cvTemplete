import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

const TILES = [
  { x: 3, y: 3 },
  { x: 13, y: 3 },
  { x: 3, y: 13 },
  { x: 13, y: 13 },
];

/**
 * "My Resumes" nav icon — four tiles that individually scale up with a
 * short stagger on hover (top-left first, reading order after), like
 * flipping through a stack of cards, then snap back together uniformly
 * (no stagger) on hover-out so the reverse feels quick and clean rather
 * than sluggishly replaying the cascade backwards. `hovered` is controlled
 * by the parent nav row, not this icon's own small bounding box, so
 * hovering anywhere on the row — not just the icon — triggers it.
 */
export default function DashboardGridIcon({ hovered, size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {TILES.map((t, i) => (
        <motion.rect
          key={i}
          x={t.x}
          y={t.y}
          width={8}
          height={8}
          rx={1.5}
          style={{ transformOrigin: `${t.x + 4}px ${t.y + 4}px` }}
          animate={hovered ? { scale: 1.18 } : { scale: 1 }}
          transition={
            hovered
              ? { duration: DURATION.fast, ease: EASE, delay: i * 0.05 }
              : { duration: DURATION.fast, ease: EASE }
          }
        />
      ))}
    </svg>
  );
}
