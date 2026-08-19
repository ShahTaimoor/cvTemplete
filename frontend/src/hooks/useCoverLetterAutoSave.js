import { useEffect, useRef } from 'react';

// Mirrors backend/src/routes/coverLetterRoutes.js's PUT allowlist exactly —
// the same fields used here to detect "did anything change" are what
// actually get sent, so metadata the server adds back (updatedAt, __v)
// never causes a spurious re-save loop.
const SAVE_FIELDS = [
  'title', 'templateSlug', 'theme', 'personal', 'recipientName', 'recipientTitle',
  'companyName', 'companyAddress', 'date', 'salutation', 'body', 'closing', 'resume',
];

export const buildCoverLetterSavePayload = (letter) =>
  SAVE_FIELDS.reduce((acc, key) => {
    acc[key] = letter[key];
    return acc;
  }, {});

/**
 * Debounced autosave for Cover Letter — same debounce/dedup shape as
 * frontend/src/hooks/useAutoSave.js (Resume's hook), adapted for Cover
 * Letter's plain-API save path (no Redux thunk here, so nothing to
 * dispatch) and its own field whitelist. `save` owns the actual request
 * plus all saving/lastSaved/saveError state and the failure toast
 * (CoverLetterPage.jsx) — this hook only decides *when* to call it.
 */
export const useCoverLetterAutoSave = (letter, save, delay = 2000) => {
  const timer = useRef(null);
  const lastPayload = useRef(null);

  useEffect(() => {
    if (!letter?._id) return;

    const payload = JSON.stringify(buildCoverLetterSavePayload(letter));
    if (payload === lastPayload.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      lastPayload.current = payload;
      save();
    }, delay);

    return () => clearTimeout(timer.current);
  }, [letter, save, delay]);
};
