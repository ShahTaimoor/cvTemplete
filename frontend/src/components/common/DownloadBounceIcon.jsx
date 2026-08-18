import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

/**
 * "PDF export" feature icon — the tray stays put; the arrow (shaft +
 * chevron) nudges downward and back once per hover, like a document
 * dropping into the tray. A single down-and-return pass, not a
 * continuous bounce loop while still hovered.
 */
export default function DownloadBounceIcon({ hovered, size = 22, className = '' }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <motion.g
        animate={hovered ? { y: [0, 3, 0] } : { y: 0 }}
        transition={
          hovered
            ? { duration: DURATION.slow, ease: EASE, times: [0, 0.5, 1] }
            : { duration: DURATION.fast, ease: EASE }
        }
      >
        <polyline points="7 10 12 15 17 10" />
        <line x1={12} y1={15} x2={12} y2={3} />
      </motion.g>
    </svg>
  );
}
