import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';

// The outline and two of the three paint dabs stay monochrome (currentColor,
// matching every other icon in the app), but this one dab is the whole
// point of the animation, so it gets real brand hues to cycle through
// rather than staying flat — brass and burgundy are the app's own accent
// colors (see index.css), landing back on brand-600 (this icon's resting
// currentColor tone in its actual usage context) so it settles seamlessly.
const REST_COLOR = '#142440';

/**
 * "Custom themes" feature icon — one paint dab gently cycles through
 * brand-600 → brass → burgundy → brand-600 on repeat while hovered
 * (unlike the other feature icons, "cycling" implies looping motion, not
 * a single pass), and simply rests back at brand-600 on hover-out.
 */
export default function PaletteDotCycleIcon({ hovered, size = 22, className = '' }) {
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
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-4-4 2 2 0 0 1 2-2h2A10 10 0 0 0 12 2Z" />
      <circle cx={8} cy={10} r={1.2} fill="currentColor" stroke="none" />
      <circle cx={8} cy={15} r={1.2} fill="currentColor" stroke="none" />
      <motion.circle
        cx={13}
        cy={17}
        r={1.4}
        stroke="none"
        animate={
          hovered
            ? { fill: [REST_COLOR, '#b98b4e', '#6e2a3b', REST_COLOR] }
            : { fill: REST_COLOR }
        }
        transition={
          hovered
            ? { duration: 1.6, ease: EASE, repeat: Infinity }
            : { duration: DURATION.fast, ease: EASE }
        }
      />
    </svg>
  );
}
