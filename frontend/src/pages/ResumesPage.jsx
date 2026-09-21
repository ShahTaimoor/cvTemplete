import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, FileText, Copy, Mail, Pencil } from 'lucide-react';
import { fetchResumes } from '../store/resumeSlice';
import { fetchTemplates } from '../store/templateSlice';
import { resumeAPI, coverLetterAPI } from '../services/api';
import TemplatePickerModal from '../components/dashboard/TemplatePickerModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import MediaCard from '../components/common/MediaCard';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem, pageFade } from '../lib/motion';
import { getPageNumbers } from '../utils/pagination';
import MotionIcon from '../components/common/MotionIcon';
import ResumePreview from '../components/resume/ResumePreview';
import Skeleton from '../components/common/Skeleton';

const PAGE_SIZE = 9;

// Renders the resume's real design live (same renderer as the Builder
// preview), scaled to the card. ResumePreview fits an A4 page to its container
// width, and the card is A4-shaped, so the first page fills it exactly.
// Not interactive - the card itself handles clicks.
function ResumeCardThumbnail({ resume }) {
  return (
    <div className="w-full h-full overflow-hidden pointer-events-none select-none" aria-hidden>
      <ResumePreview resume={resume} />
    </div>
  );
}

// Mirrors the real card's image-first-overlay shape below.
function ResumeCardSkeleton() {
  return <Skeleton shape="rounded" className="w-full aspect-[210/297]" />;
}

export default function ResumesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { list } = useSelector((s) => s.resume);
  const { user } = useSelector((s) => s.auth);
  const { items: templates } = useSelector((s) => s.templates);
  const [showNew, setShowNew] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState('classic-blue');
  const plan = user?.subscription?.plan || 'free';

  // Start true (not derived from list.length, which is `[]` whether "still
  // loading" or "genuinely empty") and flip false once each fetch has
  // actually settled — the only way to distinguish "haven't loaded yet"
  // from "loaded, and there's nothing there" so the skeleton shows for a
  // genuine load and never lingers or flashes incorrectly.
  const [resumesLoaded, setResumesLoaded] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // The resume grid below plays a stagger entrance animation keyed to
  // `animate="visible"` — a static prop that never toggles. If `list` gets a
  // new array reference (a second fetchResumes() resolving) while that
  // stagger is still mid-sequence, Framer's per-child propagation for
  // children whose individual delay hasn't elapsed yet is abandoned and
  // never retriggered, permanently stranding them at opacity:0 (only a full
  // remount clears it — this was the original Dashboard card-invisibility
  // bug). Forcing a fresh `key` whenever `list`'s reference changes makes
  // every list update fully remount the grid instead of updating it in
  // place, so there's never a "some children already in flight, others not"
  // state to strand. Computed during render (not an effect) so the key is
  // already correct in the same pass `list` changes, with no extra render
  // or visible flash of stale content.
  const [gridKey, setGridKey] = useState(0);
  const [listAtLastKey, setListAtLastKey] = useState(list);
  if (list !== listAtLastKey) {
    setListAtLastKey(list);
    setGridKey((k) => k + 1);
  }

  // Guards against dispatching the same fetch twice for the same (dispatch,
  // plan) pair — most notably React StrictMode's dev-only mount→cleanup→
  // mount double-invoke, which would otherwise fire fetchResumes() twice
  // ~200ms apart and briefly race two overlapping list updates. A genuine
  // remount (e.g. leaving and returning to the route) gets a fresh ref and
  // still fetches normally; a real plan change still refetches too, since
  // that changes the guarded key.
  const fetchedForPlanRef = useRef(null);
  useEffect(() => {
    if (fetchedForPlanRef.current === plan) return;
    fetchedForPlanRef.current = plan;
    dispatch(fetchResumes()).finally(() => setResumesLoaded(true));
    dispatch(fetchTemplates()).finally(() => setTemplatesLoaded(true));
  }, [dispatch, plan]);

  const createResume = async () => {
    try {
      const { data } = await resumeAPI.create({
        templateSlug: selectedSlug,
        withSampleData: list.length === 0,
      });
      navigate(`/builder/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create resume');
    }
  };

  const duplicateResume = async (resumeId, title) => {
    try {
      const { data } = await resumeAPI.duplicate(resumeId, { title: `${title} (Copy)` });
      dispatch(fetchResumes());
      navigate(`/builder/${data._id}`);
    } catch {
      toast.error('Duplicate failed');
    }
  };

  const deleteResume = async (id) => {
    const ok = await confirmDialog({
      title: 'Delete this resume?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await resumeAPI.remove(id);
    dispatch(fetchResumes());
    toast.success('Resume deleted');
  };

  const newCoverLetter = async (resumeId) => {
    try {
      const { data } = await coverLetterAPI.create({ resumeId });
      navigate(`/cover-letter/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Premium required for cover letters');
    }
  };

  // Same numbered-pagination pattern as TemplateGallery.jsx (getPageNumbers,
  // the Prev/numbers/Next control row) — reused via utils/pagination.js
  // rather than re-derived. currentPage clamps against totalPages so a
  // stale-high `page` (e.g. after deleting everything on the last page)
  // always resolves to something valid without a dedicated reset effect.
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const gridTopRef = useRef(null);
  useEffect(() => {
    gridTopRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentPage]);
  const pageItems = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          ref={gridTopRef}
          initial={pageFade.initial}
          animate={pageFade.animate}
          transition={pageFade.transition}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-sm font-semibold text-brass-ink mb-1">My Resumes</p>
            <h1
              className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Your resumes
            </h1>
            <p className="text-slate-600 mt-1">Manage, edit, and export every resume in one place.</p>
          </div>
          <button type="button" onClick={() => setShowNew(!showNew)} className="app-btn-primary shrink-0">
            <MotionIcon><Plus size={18} className="mr-2" /></MotionIcon>
            New resume
          </button>
        </motion.div>

        <AnimatePresence>
          {showNew && (
            <TemplatePickerModal
              templates={templates}
              loading={!templatesLoaded}
              selectedSlug={selectedSlug}
              onSelect={(tpl) => !tpl.locked && setSelectedSlug(tpl.slug)}
              onClose={() => setShowNew(false)}
              onCreate={createResume}
              isFirstResume={list.length === 0}
            />
          )}
        </AnimatePresence>

        {!resumesLoaded ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <ResumeCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            key={`${gridKey}-${currentPage}`}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer()}
          >
            {pageItems.map((r) => (
              <motion.article key={r._id} variants={staggerItem}>
                <MediaCard
                  thumbnail={
                    <ResumeCardThumbnail resume={r} />
                  }
                  title={r.title}
                  meta={[
                    r.templateSlug?.replace(/-/g, ' '),
                    `Updated ${new Date(r.updatedAt).toLocaleDateString()}`,
                  ]}
                  actions={[
                    { icon: Pencil, label: 'Edit', to: `/builder/${r._id}`, variant: 'primary' },
                    { icon: Copy, label: 'Duplicate', onClick: () => duplicateResume(r._id, r.title) },
                    plan === 'premium' && { icon: Mail, label: 'Cover letter', onClick: () => newCoverLetter(r._id) },
                    { icon: Trash2, label: 'Delete', onClick: () => deleteResume(r._id), variant: 'danger' },
                  ].filter(Boolean)}
                />
              </motion.article>
            ))}
            {!list.length && (
              <div className="col-span-full app-card p-12 text-center">
                <FileText className="mx-auto text-slate-300 mb-3" size={40} />
                <p className="text-slate-600 font-medium">No resumes yet</p>
                <p className="text-sm text-slate-500 mt-1">Create your first resume — we add sample content automatically.</p>
                <button type="button" onClick={() => setShowNew(true)} className="app-btn-primary mt-4">
                  <MotionIcon><Plus size={18} className="mr-2" /></MotionIcon>
                  Create resume
                </button>
              </div>
            )}
          </motion.div>
        )}

        {resumesLoaded && totalPages > 1 && (
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
