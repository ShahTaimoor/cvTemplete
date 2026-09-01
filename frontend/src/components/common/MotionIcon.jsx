import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

/**
 * Subtle hover/tap feedback for a lucide icon sitting inside a real
 * interactive control (nav link, action button, toolbar button). Purely
 * visual — wraps the icon in an inline-flex motion.span so it never affects
 * the parent's own layout or its existing active:scale-[0.97] CSS tap
 * feedback (app-btn-primary/app-btn-secondary); the two just compose.
 *
 * Scale-only by default, matching the app's snappy Zone B feel. `rotate` is
 * opt-in for the handful of icons where a slight turn reads as a genuine
 * affordance (e.g. the hamburger/close toggle) rather than noise.
 */
export default function MotionIcon({ children, rotate = 0 }) {
  return (
    <motion.span
      className="inline-flex"
      whileHover={{ scale: 1.15, rotate }}
      whileTap={{ scale: 0.85 }}
      transition={{ duration: DURATION.fast, ease: EASE }}
    >
      {children}
    </motion.span>
  );
}
