import { useEffect, useState } from 'react';

/**
 * Tracks browser connectivity in real time via navigator.onLine plus the
 * online/offline window events (navigator.onLine alone is only read once on
 * mount and never updates itself). Returns `[isOnline, recheck]` —
 * `recheck` re-reads navigator.onLine on demand, for a "Retry" affordance
 * to call even though the online/offline events already keep this in sync
 * automatically; it's a defensive manual re-sync, not a network probe.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const recheck = () => setIsOnline(navigator.onLine);

  return [isOnline, recheck];
}
