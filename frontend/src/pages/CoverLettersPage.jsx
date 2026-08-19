import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Trash2, Copy, Mail } from 'lucide-react';
import { coverLetterAPI } from '../services/api';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../lib/motion';
import { getTemplatePreset } from '../config/templates';
import { getPageNumbers } from '../utils/pagination';
import MotionIcon from '../components/common/MotionIcon';
import Skeleton from '../components/common/Skeleton';

const PAGE_SIZE = 9;

// Same color-swatch fallback ResumeCardThumbnail uses for resumes without a
// generated thumbnail yet (same box classes, same getTemplatePreset color
// source) — a real Puppeteer-rendered preview is a separate, bigger
// follow-up; this just brings Cover Letter cards to the same visual weight
// as resume cards. The Mail icon (this page's own icon, and the
// per-resume-card "Cover letter" button's icon) marks it as content rather
// than a blank swatch.
function CoverLetterSwatch({ letter }) {
  const preset = getTemplatePreset(letter.templateSlug);
  return (
    <div
      className="w-full aspect-[210/297] rounded-lg mb-3 flex items-center justify-center border border-slate-200"
      style={{ backgroundColor: preset.primary }}
      aria-hidden
    >
      <Mail size={40} className="text-white/70" />
    </div>
  );
}

// Mirrors the real card's swatch + title + meta + button-row layout below.
function CoverLetterCardSkeleton() {
  return (
    <div className="app-card p-5">
      <Skeleton shape="rounded" className="w-full aspect-[210/297] mb-3" />
      <Skeleton shape="rounded" width="65%" height={16} className="mb-2" />
      <Skeleton shape="rounded" width="50%" height={10} className="mb-2" />
      <Skeleton shape="rounded" width="40%" height={10} />
      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
        <Skeleton shape="rounded" className="flex-1 min-w-[80px]" height={38} />
        <Skeleton shape="rounded" width={38} height={38} />
        <Skeleton shape="rounded" width={38} height={38} />
      </div>
    </div>
  );
}

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
        <div ref={gridTopRef} className="mb-8">
          <p className="text-sm font-medium text-brand-600 mb-1">My Cover Letters</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Your cover letters</h1>
          <p className="text-slate-600 mt-1">Manage, edit, and export every cover letter in one place.</p>
        </div>

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
              <motion.article
                key={c._id}
                variants={staggerItem}
                className="app-card p-5 hover:border-brand-200 transition-colors"
              >
                <CoverLetterSwatch letter={c} />
                <h3 className="font-semibold text-slate-900 truncate">{c.title}</h3>
                {c.resume?.title && (
                  <p className="text-xs text-slate-500 mt-1 truncate">For {c.resume.title}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Updated {new Date(c.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                  <Link to={`/cover-letter/${c._id}`} className="app-btn-primary flex-1 text-center !py-2 min-w-[80px]">
                    Edit
                  </Link>
                  <button
                    type="button"
                    title="Duplicate"
                    onClick={() => duplicateCoverLetter(c._id, c.title)}
                    className="app-btn-secondary !p-2"
                  >
                    <MotionIcon><Copy size={18} /></MotionIcon>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCoverLetter(c._id)}
                    className="app-btn-secondary !p-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                  >
                    <MotionIcon><Trash2 size={18} /></MotionIcon>
                  </button>
                </div>
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
