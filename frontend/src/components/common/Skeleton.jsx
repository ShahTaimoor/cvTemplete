const SHAPE_CLASS = {
  rectangle: '',
  rounded: 'rounded-lg',
  circle: 'rounded-full',
};

/**
 * Base shimmering placeholder block — brand-tinted (navy base, brass sweep
 * band), not the generic gray most skeleton systems default to. The sweep
 * uses the same clipped-band technique as CreditCardShineIcon and the
 * Landing CTA shine: a w-1/2 band travels from -100% to 200%, which for a
 * half-width band is exactly flush with each edge at rest/end, so no travel
 * distance is wasted off-screen.
 *
 * Driven by a plain CSS animation (`animate-shimmer`, defined in index.css)
 * rather than Framer Motion, specifically because a Skeleton is typically
 * the very first thing a route paints — mounting concurrently with the
 * app-wide page-enter transition every route sits inside (see App.jsx's
 * PageTransition) was observed silently dropping Framer Motion's
 * `repeat: Infinity` and freezing the shimmer after exactly one cycle. A
 * CSS animation has no dependency on React/Framer Motion's render or
 * transition lifecycle, so it keeps looping regardless of what's mounting
 * around it.
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
      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-brass/25 to-transparent animate-shimmer" />
    </div>
  );
}
