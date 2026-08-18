import { motion } from 'framer-motion';

const SHAPE_CLASS = {
  rectangle: '',
  rounded: 'rounded-lg',
  circle: 'rounded-full',
};

/**
 * Base shimmering placeholder block — brand-tinted (navy base, brass sweep
 * band), not the generic gray most skeleton systems default to. The sweep
 * uses the same clipped-band translate-x technique as CreditCardShineIcon
 * and the Landing CTA shine: a w-1/2 band travels from -100% to 200%, which
 * for a half-width band is exactly flush with each edge at rest/end, so no
 * travel distance is wasted off-screen.
 *
 * Sized either via `width`/`height` (any CSS value) or by letting
 * `className` carry layout utilities (w-full, flex-1, aspect-[...], etc.) —
 * whichever props/classes aren't passed simply fall through to the other.
 */
export default function Skeleton({ width, height, shape = 'rounded', className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden shrink-0 bg-brand-50 ${SHAPE_CLASS[shape] ?? SHAPE_CLASS.rounded} ${className}`}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-brass/25 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}
