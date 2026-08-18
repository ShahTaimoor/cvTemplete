import { motion } from 'framer-motion';
import { EASE, DURATION } from '../../lib/motion';

// A small 4-point sparkle/diamond shape centered at (cx, cy) with the given
// half-width `s` — generated rather than hand-authored per instance so the
// big center sparkle and the two small accent sparkles are all genuinely
// the same shape at different sizes/positions, not three ad-hoc paths.
const sparklePath = (cx, cy, s) =>
  `M${cx} ${cy - s} L${cx + s * 0.22} ${cy - s * 0.22} L${cx + s} ${cy} L${cx + s * 0.22} ${cy + s * 0.22} ` +
  `L${cx} ${cy + s} L${cx - s * 0.22} ${cy + s * 0.22} L${cx - s} ${cy} L${cx - s * 0.22} ${cy - s * 0.22} Z`;

const SPARKLES = [
  { cx: 12, cy: 11, size: 5, delay: 0 },
  { cx: 19, cy: 6, size: 2.2, delay: 0.15 },
  { cx: 5, cy: 18, size: 2.2, delay: 0.3 },
];

/**
 * "Auto-save" feature icon — three sparkles twinkle (scale + opacity pulse)
 * on repeat while hovered, each on its own staggered delay so they don't
 * pulse in unison, reading as a genuine twinkle rather than one flat pulse.
 * Rest state is just the plain static shapes.
 */
export default function SparklesTwinkleIcon({ hovered, size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      {SPARKLES.map((s, i) => (
        <motion.path
          key={i}
          d={sparklePath(s.cx, s.cy, s.size)}
          style={{ transformOrigin: `${s.cx}px ${s.cy}px` }}
          animate={
            hovered
              ? { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }
              : { scale: 1, opacity: 1 }
          }
          transition={
            hovered
              ? { duration: 1.2, ease: EASE, repeat: Infinity, delay: s.delay }
              : { duration: DURATION.fast, ease: EASE }
          }
        />
      ))}
    </svg>
  );
}
