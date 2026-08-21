import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

/**
 * Sign-out icon — the door frame stays put; the arrow (shaft + head)
 * slides further outward through the doorway on hover, suggesting
 * "exiting", and slides back on hover-out.
 */
export default function LogOutSlideIcon({ hovered, size = 16, className = '' }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <motion.g
        animate={hovered ? { x: 2.5 } : { x: 0 }}
        transition={{ duration: DURATION.fast, ease: EASE }}
      >
        <line x1={21} y1={12} x2={9} y2={12} />
        <polyline points="16 17 21 12 16 7" />
      </motion.g>
    </svg>
  );
}
