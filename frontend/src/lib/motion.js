/**
 * Shared Framer Motion tokens for the functional app (Dashboard, Builder,
 * modals, toasts, nav, grids). Short durations, no bounce/spring — these
 * animations support frequent, repeat actions and must never slow the user
 * down or feel repetitive.
 *
 * The landing page (frontend/src/pages/LandingPage.jsx) intentionally does
 * NOT use these tokens — it defines its own, more expressive motion
 * language locally, since it's a one-time first impression, not a tool
 * people click through dozens of times a day.
 */

export const EASE = [0.4, 0, 0.2, 1];

export const DURATION = {
  fast: 0.15,
  base: 0.2,
  slow: 0.28,
};

export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.fast, ease: EASE },
};

export const modalCard = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 4 },
  transition: { duration: DURATION.base, ease: EASE },
};

export const pageFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: DURATION.fast, ease: EASE },
};

export const toastSlide = {
  initial: { opacity: 0, x: 32, scale: 0.95 },
  animate: { opacity: 1, x: 0, scale: 1, transition: { duration: DURATION.base, ease: EASE } },
  exit: { opacity: 0, x: 32, scale: 0.95, transition: { duration: DURATION.fast, ease: EASE } },
};

export const drawerPanel = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { duration: DURATION.slow, ease: EASE },
};

/** Stagger wrapper for grids/lists — pass a tighter interval for long grids. */
export const staggerContainer = (stagger = 0.04) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: 0.02 } },
});

export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE } },
};

/** A small delayed pop for a decorative/informational icon (not a click
 * target) inside a card or banner that's itself already entering — reads as
 * "the icon arrives a beat after its container", not a second competing
 * animation. Pass a `delay` (seconds) to stagger multiple icons. */
export const iconPopIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE, delay } },
});
