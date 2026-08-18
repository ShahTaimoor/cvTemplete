import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

/**
 * "330+ templates" feature icon — a back page and a front (detailed)
 * page fan apart on hover, like riffling through a stack of documents.
 * Each page pivots near its own bottom corner so the fan reads as
 * spreading from a fixed base, not just sliding sideways.
 */
export default function FileTextFanIcon({ hovered, size = 22, className = '' }) {
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
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <motion.g
        style={{ transformOrigin: '9px 20px' }}
        animate={hovered ? { rotate: -12, x: -1, y: 1 } : { rotate: 0, x: 0, y: 0 }}
        transition={transition}
      >
        <rect x={4} y={3} width={12} height={16} rx={1.5} />
      </motion.g>
      <motion.g
        style={{ transformOrigin: '16px 20px' }}
        animate={hovered ? { rotate: 12, x: 1, y: 1 } : { rotate: 0, x: 0, y: 0 }}
        transition={transition}
      >
        <path d="M8 3h6l4 4v12a1.5 1.5 0 0 1-1.5 1.5h-8.5A1.5 1.5 0 0 1 6.5 19V4.5A1.5 1.5 0 0 1 8 3Z" />
        <path d="M14 3v4h4" />
        <line x1={9} y1={12} x2={15} y2={12} />
        <line x1={9} y1={15} x2={13} y2={15} />
      </motion.g>
    </svg>
  );
}
