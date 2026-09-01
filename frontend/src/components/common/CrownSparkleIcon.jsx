import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DURATION, EASE } from '../../lib/motion';

/**
 * Plan-badge crown icon — a small sparkle briefly appears and fades near
 * the crown's center peak on hover-start: a single appear-then-fade flash,
 * not a continuous loop while still hovered. Keyed by an incrementing
 * counter so every fresh hover remounts (and cleanly restarts) the sparkle
 * rather than resuming or fighting over shared animation state — including
 * back-to-back rapid hovers, each gets its own clean flash.
 *
 * `sparkleKey` starts at 0 and only increments on a genuine hover-start
 * (never on initial mount), and `animate` only resolves to the actual
 * keyframe flash once sparkleKey > 0 — otherwise the very first render
 * would auto-play the sparkle before the user ever hovered anything.
 */
export default function CrownSparkleIcon({ hovered, size = 16, className = '' }) {
  const [sparkleKey, setSparkleKey] = useState(0);

  useEffect(() => {
    if (hovered) setSparkleKey((k) => k + 1);
  }, [hovered]);

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
      <path d="M2 18 L2 8 L7 12 L12 4 L17 12 L22 8 L22 18 Z" />
      <motion.path
        key={sparkleKey}
        d="M12 0 L12.8 2.2 L15 3 L12.8 3.8 L12 6 L11.2 3.8 L9 3 L11.2 2.2 Z"
        fill="currentColor"
        stroke="none"
        style={{ transformOrigin: '12px 3px' }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          sparkleKey > 0
            ? { opacity: [0, 1, 0], scale: [0.5, 1.15, 0.7] }
            : { opacity: 0, scale: 0.5 }
        }
        transition={{ duration: DURATION.slow, ease: EASE, times: [0, 0.4, 1] }}
      />
    </svg>
  );
}
