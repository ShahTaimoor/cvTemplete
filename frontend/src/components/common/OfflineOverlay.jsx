import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCw } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from '../../hooks/useToast';
import { overlayFade, modalCard } from '../../lib/motion';
import MotionIcon from './MotionIcon';
import offlineIllustration from '../../assets/images/offline-illustration.png';

/**
 * Full-screen "you're offline" state, mounted once in App.jsx alongside
 * (not inside) AppRoutes so it covers whichever page the user happens to be
 * on — a dropped connection shouldn't leave someone staring at a frozen or
 * half-loaded page with no explanation. Deliberately opaque (not a
 * translucent scrim over the frozen page): the page underneath may be
 * mid-request or showing stale data, so fully replacing it avoids implying
 * any of that content is still trustworthy.
 *
 * Scope is intentionally the simple, correct default this needs: shows
 * whenever navigator.onLine is false, on any route, no per-page opt-in
 * required. Dismisses itself automatically the moment the browser's own
 * `online` event fires (see useOnlineStatus) — Retry exists for the rare
 * case that needs a manual nudge, not as the primary recovery path.
 */
export default function OfflineOverlay() {
  const [isOnline, recheck] = useOnlineStatus();
  const toast = useToast();
  const wasOffline = useRef(false);

  // The <img> below only ever mounts once isOnline is already false, so
  // without this, the browser's first attempt to actually fetch the
  // illustration would be made *while offline* — the network request for
  // the image itself would fail at the exact moment it's needed. Warming
  // the browser's cache here, unconditionally, on mount (i.e. while the
  // app is presumably still online) means the <img> below can be served
  // from cache once it does need to render.
  useEffect(() => {
    const img = new Image();
    img.src = offlineIllustration;
  }, []);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success('Back online');
    }
  }, [isOnline, toast]);

  const handleRetry = () => {
    recheck();
    if (!navigator.onLine) {
      toast.info('Still offline — check your connection');
    }
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed inset-0 z-[90] bg-mist flex items-center justify-center p-6"
          initial={overlayFade.initial}
          animate={overlayFade.animate}
          exit={overlayFade.exit}
          transition={overlayFade.transition}
          role="alert"
          aria-live="assertive"
        >
          <motion.div
            className="max-w-sm w-full text-center"
            initial={modalCard.initial}
            animate={modalCard.animate}
            exit={modalCard.exit}
            transition={modalCard.transition}
          >
            <img
              src={offlineIllustration}
              alt="Torn resume and broken pen illustration"
              className="mx-auto mb-6 w-full max-w-[300px] h-auto"
            />
            <h1
              className="text-2xl sm:text-3xl font-medium text-brand-600 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Looks like you're offline
            </h1>
            <p className="text-slate-600 mt-2">
              Check your connection — we'll pick up right where you left off.
            </p>
            <button type="button" onClick={handleRetry} className="app-btn-primary mt-6">
              <MotionIcon>
                <RotateCw size={18} className="mr-2" />
              </MotionIcon>
              Retry
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
