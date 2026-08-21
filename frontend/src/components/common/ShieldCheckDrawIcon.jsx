import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

/**
 * "ATS checker" feature icon — a checkmark strokes itself in inside the
 * shield on hover (Framer's `pathLength`, the genuine SVG path-draw
 * technique — not a fade or a pre-drawn icon swap), reinforcing
 * "verified/optimized". Un-draws smoothly on hover-out.
 */
export default function ShieldCheckDrawIcon({ hovered, size = 22, className = '' }) {
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
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <motion.path
        d="M8.5 12.5l2.5 2.5 5-5"
        initial={false}
        animate={hovered ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE }}
      />
    </svg>
  );
}
