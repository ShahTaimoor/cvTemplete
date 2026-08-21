import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Trash2, Copy, Mail, Pencil } from 'lucide-react';
import { coverLetterAPI } from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem, pageFade } from '../lib/motion';
import { getTemplatePreset } from '../config/templates';
import { getPageNumbers } from '../utils/pagination';
import Skeleton from '../components/common/Skeleton';
import MediaCard from '../components/common/MediaCard';

const PAGE_SIZE = 9;

// Server-generated screenshot of the cover letter's actual content (see
// backend/src/services/thumbnailService.js's generateCoverLetterThumbnail),
// regenerated whenever the editor is exited — mirrors ResumeCardThumbnail
// in ResumesPage.jsx exactly (same broken-image self-heal contract via
// onBroken, same key={thumbnailUrl} remount trick at the call site so a
// healed URL actually gets rendered instead of being stranded on the
// fallback). Falls back to the same Mail-icon color swatch this page
// already used before real thumbnails existed, for letters that don't
// have one yet (brand new, or older than this feature).
//
// Only fills its container now — MediaCard (see components/common/MediaCard)
// owns the aspect-ratio box, rounding, and border around it.
function CoverLetterCardThumbnail({ letter, onBroken }) {
  const [broken, setBroken] = useState(false);
  const showImage = !!letter.thumbnailUrl && !broken;
  const preset = getTemplatePreset(letter.templateSlug);

  const handleError = () => {
    setBroken(true);
    onBroken?.(letter._id, letter.thumbnailGeneratedAt || null);
  };

  return (
    <div
      className="w-full h-full"
      style={!showImage ? { backgroundColor: preset.primary } : undefined}
      aria-hidden
    >
      {showImage ? (
        <img
          src={letter.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={handleError}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Mail size={40} className="text-white/70" />
        </div>
      )}
    </div>
  );
}

function CoverLetterCardSkeleton() {
  return <Skeleton shape="rounded" className="w-full aspect-[210/297]" />;
}

// A cover letter counts as "likely mid-generation" either because it was
// edited very recently and its thumbnail hasn't caught up yet, or because
// the server explicitly deferred a regeneration for it (thumbnailPending —
// see thumbnailService.js's fulfillIfDue). Mirrors isThumbnailPending in
// ResumesPage.jsx exactly, including thumbnailPending being unbounded by
// POLL_CANDIDATE_WINDOW_MS on purpose — it's an authoritative server
// signal, not a client-side time guess, and can stay true for as long as
// the throttle cooldown (several minutes), well past that window.
const POLL_CANDIDATE_WINDOW_MS = 30_000;
const isThumbnailPending = (letter) => {
  if (letter.thumbnailPending) return true;
  const updatedAt = new Date(letter.updatedAt).getTime();
  if (Date.now() - updatedAt > POLL_CANDIDATE_WINDOW_MS) return false;
  const generatedAt = letter.thumbnailGeneratedAt ? new Date(letter.thumbnailGeneratedAt).getTime() : null;
  return !generatedAt || generatedAt < updatedAt;
};

export default function CoverLettersPage() {
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { user } = useSelector((s) => s.auth);
  const plan = user?.subscription?.plan || 'free';
  const [coverLetters, setCoverLetters] = useState([]);
  const [coverLettersLoaded, setCoverLettersLoaded] = useState(false);

  useEffect(() => {
    if (plan !== 'premium') return;
    coverLetterAPI.list().then((r) => setCoverLetters(r.data)).catch(() => {}).finally(() => setCoverLettersLoaded(true));
  }, [plan]);

  // Thumbnail generation (on editor-exit, or the self-healing retry below)
  // is fire-and-forget and takes a few seconds — mirrors ResumesPage.jsx's
  // thumbnailOverrides/watchThumbnail/handleThumbnailBroken trio exactly,
  // including the reasoning in its comments: polled updates are kept in a
  // separate map and merged into each card's props at render time, rather
  // than folded into `coverLetters` directly, because this grid plays a
  // staggerChildren entrance animation on mount — updating the mapped
  // array's reference while that's still mid-sequence can permanently
  // strand not-yet-animated children at opacity:0 (a real Framer Motion
  // gotcha, not hypothetical — see ResumesPage.jsx's own note on the
  // original Dashboard card-invisibility bug this exact pattern fixed).
  const [thumbnailOverrides, setThumbnailOverrides] = useState({});

  // De-dupes concurrent watchers for the same letter — both the "just
  // edited" candidate scan below and the self-healing onError path further
  // down can want to watch the same id.
  const activeRef = useRef(new Set());
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => { unmountedRef.current = true; };
  }, []);

  // Shared poller: watches one cover letter until its thumbnailGeneratedAt
  // moves on from `baselineGeneratedAt` or a bounded timeout elapses.
  // Mirrors watchThumbnail in ResumesPage.jsx exactly, using
  // coverLetterAPI in place of resumeAPI — including the `deferred` mode
  // for a thumbnailPending item, which polls much slower but for much
  // longer (this same GET is what makes the server's fulfillIfDue actually
  // fire once the cooldown passes — see coverLetterRoutes.js).
  const watchThumbnail = useCallback((letterId, baselineGeneratedAt, deferred = false) => {
    if (activeRef.current.has(letterId)) return;
    activeRef.current.add(letterId);

    const POLL_INTERVAL_MS = deferred ? 15_000 : 2_000;
    const TIMEOUT_MS = deferred ? 6 * 60 * 1000 : 12_000; // 6min covers the 5min cooldown plus generation time
    const startedAt = Date.now();

    const poll = async () => {
      if (unmountedRef.current) { activeRef.current.delete(letterId); return; }
      const data = await coverLetterAPI.get(letterId).then((r) => r.data).catch(() => null);
      if (unmountedRef.current) { activeRef.current.delete(letterId); return; }

      if (data?.thumbnailGeneratedAt &&
          (!baselineGeneratedAt || new Date(data.thumbnailGeneratedAt) > new Date(baselineGeneratedAt))) {
        setThumbnailOverrides((prev) => ({
          ...prev,
          [letterId]: { thumbnailUrl: data.thumbnailUrl, thumbnailGeneratedAt: data.thumbnailGeneratedAt },
        }));
        activeRef.current.delete(letterId);
        return;
      }

      if (Date.now() - startedAt < TIMEOUT_MS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        activeRef.current.delete(letterId);
      }
    };

    setTimeout(poll, POLL_INTERVAL_MS);
  }, []);

  useEffect(() => {
    coverLetters.filter(isThumbnailPending).forEach((c) => watchThumbnail(c._id, c.thumbnailGeneratedAt || null, !!c.thumbnailPending));
  }, [coverLetters, watchThumbnail]);

  // Self-healing on a broken thumbnail URL — mirrors handleThumbnailBroken
  // in ResumesPage.jsx exactly, through the same throttled endpoint the
  // editor-exit trigger uses, so a burst of simultaneously-broken
  // thumbnails doesn't spam Puppeteer. The endpoint now always accepts the
  // request (202, either `status: 'started'` or `status: 'pending'`)
  // rather than silently dropping a throttled one, so both cases are
  // watched; only the poll's own interval/timeout differ between them.
  const handleThumbnailBroken = useCallback((letterId, currentGeneratedAt) => {
    if (activeRef.current.has(letterId)) return;
    activeRef.current.add(letterId);
    coverLetterAPI
      .regenerateThumbnail(letterId)
      .then((res) => {
        activeRef.current.delete(letterId);
        if (res.data?.status === 'started' || res.data?.status === 'pending') {
          watchThumbnail(letterId, currentGeneratedAt, res.data.status === 'pending');
        }
      })
      .catch(() => { activeRef.current.delete(letterId); });
  }, [watchThumbnail]);

  // Matches duplicateResume exactly: the "(Copy)" suffix is applied here
  // (not left to the backend's own fallback), and it navigates straight
  // into the new copy's editor rather than staying on this page.
  const duplicateCoverLetter = async (letterId, title) => {
    try {
      const { data } = await coverLetterAPI.duplicate(letterId, { title: `${title} (Copy)` });
      setCoverLetters((prev) => [data, ...prev]);
      navigate(`/cover-letter/${data._id}`);
    } catch {
      toast.error('Duplicate failed');
    }
  };

  const deleteCoverLetter = async (letterId) => {
    const ok = await confirmDialog({
      title: 'Delete this cover letter?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await coverLetterAPI.remove(letterId);
    setCoverLetters((prev) => prev.filter((c) => c._id !== letterId));
    toast.success('Cover letter deleted');
  };

  // Same numbered-pagination pattern as TemplateGallery.jsx / ResumesPage.jsx.
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(coverLetters.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const gridTopRef = useRef(null);
  useEffect(() => {
    gridTopRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentPage]);
  const pageItems = coverLetters.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (plan !== 'premium') {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-16 text-center px-4">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Cover letters — Premium</h1>
          <p className="text-slate-600 mb-4">Upgrade to Premium to create matching cover letters.</p>
          <Link to="/pricing" className="text-brand-600 font-semibold hover:underline">
            View plans
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          ref={gridTopRef}
          initial={pageFade.initial}
          animate={pageFade.animate}
          transition={pageFade.transition}
          className="mb-8"
        >
          <p className="text-sm font-semibold text-brass-ink mb-1">My Cover Letters</p>
          <h1
            className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Your cover letters
          </h1>
          <p className="text-slate-600 mt-1">Manage, edit, and export every cover letter in one place.</p>
        </motion.div>

        {!coverLettersLoaded ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CoverLetterCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            key={currentPage}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer()}
          >
            {pageItems.map((c) => (
              <motion.article key={c._id} variants={staggerItem}>
                <MediaCard
                  thumbnail={
                    <CoverLetterCardThumbnail
                      key={thumbnailOverrides[c._id]?.thumbnailUrl ?? c.thumbnailUrl}
                      letter={thumbnailOverrides[c._id] ? { ...c, ...thumbnailOverrides[c._id] } : c}
                      onBroken={handleThumbnailBroken}
                    />
                  }
                  title={c.title}
                  meta={[
                    c.resume?.title ? `For ${c.resume.title}` : null,
                    `Updated ${new Date(c.updatedAt).toLocaleDateString()}`,
                  ].filter(Boolean)}
                  actions={[
                    { icon: Pencil, label: 'Edit', to: `/cover-letter/${c._id}`, variant: 'primary' },
                    { icon: Copy, label: 'Duplicate', onClick: () => duplicateCoverLetter(c._id, c.title) },
                    { icon: Trash2, label: 'Delete', onClick: () => deleteCoverLetter(c._id), variant: 'danger' },
                  ]}
                />
              </motion.article>
            ))}
            {!coverLetters.length && (
              <div className="col-span-full app-card p-12 text-center">
                <Mail className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-600 font-medium">No cover letters yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Create one from any resume card on the{' '}
                  <Link to="/resumes" className="text-brand-600 font-medium hover:underline">My Resumes</Link>{' '}
                  page — we'll match its personal details and template automatically.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {coverLettersLoaded && totalPages > 1 && (
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-6">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-slate-600 border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            {getPageNumbers(currentPage, totalPages).map((n, i) =>
              n === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={n}
                  onClick={() => setPage(n)}
                  className={`min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-medium border ${
                    n === currentPage
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-slate-600 border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
