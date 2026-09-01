import { motion } from 'framer-motion';
import { useId } from 'react';
import { DURATION, EASE } from '../../lib/motion';

/**
 * "Plans & Pricing" nav icon — a soft diagonal light sweep across the card
 * on hover, clipped to the card's own rounded-rect shape. Plays once per
 * hover (no continuous loop while still hovered — `animate` just reaches
 * its target and stops); on hover-out it resets instantly rather than
 * visibly sweeping backward, so it's ready for a clean one-shot flash on
 * the next hover instead of looking like a reverse animation.
 *
 * The skew lives on a plain (Framer-unmanaged) inner <rect>, with the
 * outer motion.g owning the hover-driven translate/opacity — Framer writes
 * its own inline `transform`, which would silently win over (and discard)
 * a static `transform="skewX()"` attribute placed on the same element.
 */
export default function CreditCardShineIcon({ hovered, size = 18, className = '' }) {
  const uid = useId();
  const clipId = `cc-clip-${uid}`;
  const gradId = `cc-shine-${uid}`;

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
      <defs>
        <clipPath id={clipId}>
          <rect x={2} y={5} width={20} height={14} rx={2} />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="50%" stopColor="white" stopOpacity="0.85" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={2} y={5} width={20} height={14} rx={2} />
      <line x1={2} y1={10} x2={22} y2={10} />
      <g clipPath={`url(#${clipId})`}>
        <motion.g
          animate={hovered ? { x: 24, opacity: 1 } : { x: -8, opacity: 0 }}
          transition={
            hovered
              ? { duration: DURATION.slow, ease: EASE }
              : { x: { duration: 0 }, opacity: { duration: DURATION.fast, ease: EASE } }
          }
        >
          <rect x={-3} y={2} width={6} height={20} fill={`url(#${gradId})`} stroke="none" transform="skewX(-20)" />
        </motion.g>
      </g>
    </svg>
  );
}
