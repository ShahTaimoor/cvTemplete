import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import { DURATION, EASE } from '../../lib/motion';

// Module-level, not component state, so it survives remounts from
// client-side navigation — each page renders its own <DashboardLayout>, so
// without this the entrance would replay on every single page view rather
// than being noticed once. A hard reload (a fresh module evaluation) is the
// only thing that resets it, which is the correct "first mount" scope.
//
// Flipped in an effect (after commit), not inside the state initializer
// below: the desktop sidebar's Seal and the mobile header's Seal both
// mount simultaneously on first load (only one is visually shown at a time
// via responsive CSS, but both exist in the DOM), so their render-phase
// `!hasPlayedEntrance` checks must both still see `false` — an effect only
// runs after the whole batch has already committed, so it can't flip the
// flag out from under the second instance before it's had a chance to look.
let hasPlayedEntrance = false;

/** Small circular emblem — the brand's recurring "seal of trust" signature,
 * reserved for burgundy per the approved concept (Pro/Premium + trust marks).
 * Plays a single, restrained scale-in once per session when the sidebar
 * first mounts — never a hover effect, never repeating or looping. */
export default function Seal({ size = 40, className = '' }) {
  const [playEntrance] = useState(() => !hasPlayedEntrance);
  useEffect(() => {
    hasPlayedEntrance = true;
  }, []);

  const transition = { duration: DURATION.slow, ease: EASE };

  return (
    <motion.span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-burgundy text-mist ${className}`}
      style={{ width: size, height: size }}
      initial={playEntrance ? { scale: 0.5, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={transition}
    >
      <motion.span
        className="absolute -inset-1 rounded-full border border-burgundy/30"
        initial={playEntrance ? { scale: 0.7, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...transition, delay: playEntrance ? 0.1 : 0 }}
      />
      <Shield size={size * 0.5} strokeWidth={2} />
    </motion.span>
  );
}
