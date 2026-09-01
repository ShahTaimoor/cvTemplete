import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DURATION, EASE } from '../../lib/motion';
import MotionIcon from './MotionIcon';

// Real hover capability (a mouse/trackpad), not just "did a mouseenter
// event fire" — some touch browsers simulate a hover-ish state right
// after a tap, which would otherwise make the tap-to-toggle path below
// unreliable on a second tap. Mirrors the matchMedia-over-resize-listener
// pattern already used for useIsMobile in DashboardPage.jsx.
function useHasHover() {
  const [hasHover, setHasHover] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = () => setHasHover(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return hasHover;
}

const scrimVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// A small y-slide on top of the scrim's plain fade so the revealed content
// reads as sliding into place, not just materializing — inherits
// hidden/visible from the scrim's `animate` prop via Framer's variant
// propagation (no separate initial/animate needed on these).
const contentVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0 },
};

const actionButtonClass = (variant) =>
  `flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur-sm transition-colors ${
    variant === 'danger'
      ? 'bg-white/95 text-red-600 hover:bg-white'
      : variant === 'primary'
        ? 'bg-brand-600 text-white hover:bg-brand-700'
        : 'bg-white/95 text-slate-700 hover:bg-white'
  }`;

/**
 * Image-first overlay card, shared by ResumesPage.jsx and
 * CoverLettersPage.jsx: `thumbnail` (already-fetched real image or the
 * fallback swatch — see ResumeCardThumbnail/CoverLetterCardThumbnail,
 * unchanged aside from no longer owning their own aspect-ratio box, which
 * this component now provides) fills the card by default. Hovering
 * (desktop) or focusing any control inside it (keyboard — this listens for
 * the bubbled focus/blur React already delegates from descendants, the
 * same effect as CSS :focus-within) reveals a dark scrim with `actions` in
 * the top-right and `title`/`meta` in the bottom-left. On a device with no
 * real hover (touch), the whole card becomes a tap-to-toggle instead, with
 * a document-level listener closing it on an outside tap.
 *
 * `actions` is `{ icon, label, variant?, onClick? | to? }[]` — `to` renders
 * a router Link (the "Edit" action, navigating into the Builder/editor),
 * everything else a plain button. Every action stops propagation so
 * clicking it doesn't also trigger the card's own tap-toggle.
 */
export default function MediaCard({ thumbnail, title, meta = [], actions = [] }) {
  const hasHover = useHasHover();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const cardRef = useRef(null);
  const revealed = hasHover ? hovered || focused : tapped;

  useEffect(() => {
    if (!tapped) return;
    const onPointerDown = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) setTapped(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [tapped]);

  return (
    <div
      ref={cardRef}
      role="group"
      aria-label={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!cardRef.current?.contains(e.relatedTarget)) setFocused(false);
      }}
      onClick={() => { if (!hasHover) setTapped((t) => !t); }}
      className="relative w-full aspect-[210/297] rounded-lg overflow-hidden border border-slate-200 bg-slate-100"
    >
      <div className="absolute inset-0">{thumbnail}</div>

      {/*
        Always mounted (not conditionally rendered via AnimatePresence) so
        the action buttons/links are real, tabbable DOM nodes even while
        invisible — otherwise a keyboard user could never Tab onto them in
        the first place to trigger the reveal via onFocus below (revealing
        would require focus, and focus would require the button to already
        be reachable: a chicken-and-egg deadlock with conditional mounting).
        This is what actually makes it :focus-within-equivalent. Only
        pointer/mouse interaction is gated while hidden (pointer-events-none),
        never keyboard reachability.
      */}
      <motion.div
        className={`absolute inset-0 bg-slate-900/65 ${revealed ? '' : 'pointer-events-none'}`}
        initial="hidden"
        animate={revealed ? 'visible' : 'hidden'}
        variants={scrimVariants}
        transition={{ duration: DURATION.fast, ease: EASE }}
      >
        <motion.div
          className="absolute top-2 right-2 flex items-center gap-1.5"
          variants={contentVariants}
          transition={{ duration: DURATION.base, ease: EASE }}
        >
          {actions.map(({ icon: Icon, label, variant, onClick, to }) =>
            to ? (
              <Link
                key={label}
                to={to}
                title={label}
                aria-label={label}
                onClick={(e) => e.stopPropagation()}
                className={actionButtonClass(variant)}
              >
                <MotionIcon><Icon size={15} /></MotionIcon>
              </Link>
            ) : (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                className={actionButtonClass(variant)}
              >
                <MotionIcon><Icon size={15} /></MotionIcon>
              </button>
            )
          )}
        </motion.div>

        <motion.div
          className="absolute bottom-0 left-0 right-0 p-3 pt-8 bg-gradient-to-t from-slate-900/50 to-transparent"
          variants={contentVariants}
          transition={{ duration: DURATION.base, ease: EASE }}
        >
          <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
          {meta.map((line, i) => (
            <p key={i} className="text-xs text-white/80 truncate mt-0.5">{line}</p>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
