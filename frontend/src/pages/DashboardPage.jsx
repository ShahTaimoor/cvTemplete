import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, FileText, Copy, Mail, Crown, LayoutTemplate, Eye, Clock, Download, TrendingUp } from 'lucide-react';
import { fetchResumes } from '../store/resumeSlice';
import { fetchTemplates } from '../store/templateSlice';
import { resumeAPI, coverLetterAPI } from '../services/api';
import TemplatePickerModal from '../components/dashboard/TemplatePickerModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem, pageFade, iconPopIn } from '../lib/motion';
import { getTemplatePreset } from '../config/templates';
import MotionIcon from '../components/common/MotionIcon';

// One real, data-backed nudge for Pro/Premium accounts (see GET
// /resumes/dashboard-insight) — never a generic filler. Renders nothing at
// all for `type: 'none'`, not an empty placeholder box. Burgundy is the
// brand's reserved Pro/Premium-indicator accent (see index.css), matching
// how it's already used for the Premium plan card on Pricing.
//
// 'activity' shows every resume with real views/downloads this week (not
// just the single busiest one) as a row of compact chips — flex-wrap so a
// handful of active resumes wraps to multiple lines on narrow screens
// instead of overflowing or needing a scroll affordance. 'stale' is a
// simpler, single-line fallback for when nothing happened this week at
// all — a different, gentler kind of nudge, so it keeps its own layout
// rather than being forced into the chip treatment.
function InsightBanner({ insight }) {
  if (!insight || insight.type === 'none') return null;

  if (insight.type === 'activity') {
    return (
      <motion.div
        initial={pageFade.initial}
        animate={pageFade.animate}
        transition={pageFade.transition}
        className="mb-8 rounded-xl border border-burgundy/20 bg-burgundy/5 px-4 py-3.5"
      >
        <div className="flex items-center gap-2 mb-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-burgundy/10 text-burgundy">
            <TrendingUp size={15} />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-burgundy">This week's activity</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {insight.items.map((item, i) => (
            <div
              key={item.resumeId}
              className="flex items-center gap-2.5 rounded-lg border border-burgundy/15 bg-white px-3 py-1.5 max-w-full"
            >
              <span className="text-sm font-medium text-graphite truncate max-w-[160px]">{item.resumeTitle}</span>
              {item.views > 0 && (
                <span className="flex items-center gap-1 text-xs text-burgundy shrink-0">
                  <motion.span {...iconPopIn(0.15 + i * 0.05)}><Eye size={13} /></motion.span> {item.views}
                </span>
              )}
              {item.downloads > 0 && (
                <span className="flex items-center gap-1 text-xs text-burgundy shrink-0">
                  <motion.span {...iconPopIn(0.15 + i * 0.05)}><Download size={13} /></motion.span> {item.downloads}
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={pageFade.initial}
      animate={pageFade.animate}
      transition={pageFade.transition}
      className="mb-8 flex items-center gap-3 rounded-xl border border-burgundy/20 bg-burgundy/5 px-4 py-3.5"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-burgundy/10 text-burgundy">
        <Clock size={18} />
      </span>
      <p className="text-sm font-medium text-graphite">
        It's been {insight.daysSinceUpdate} days since you updated {insight.resumeTitle}
      </p>
    </motion.div>
  );
}

// Server-generated screenshot of the resume's actual design (see
// backend/src/services/thumbnailService.js), regenerated whenever the
// Builder is exited. Falls back to the existing flat color-swatch treatment
// — just sized to the same box, instead of a small corner icon — for
// resumes that don't have one yet (brand new, or older than this feature).
// onError swaps back to that same fallback so a broken/expired image URL
// never renders as a broken-image icon, and also reports the break upward
// (see onBroken) so the Dashboard can self-heal it in the background.
//
// `broken` is local state, so once set it would otherwise stay stuck true
// forever even after a successful self-heal hands this component a fresh
// thumbnailUrl — a prop change alone doesn't reset a component's own state.
// The call site keys this component by thumbnailUrl specifically so a new
// URL forces a real remount (fresh `broken = false`), giving the recovered
// image an actual chance to render instead of being stranded on the swatch.
function ResumeCardThumbnail({ resume, onBroken }) {
  const [broken, setBroken] = useState(false);
  const showImage = !!resume.thumbnailUrl && !broken;

  const handleError = () => {
    setBroken(true);
    onBroken?.(resume._id, resume.thumbnailGeneratedAt || null);
  };

  return (
    <div
      className="w-full aspect-[210/297] rounded-lg mb-3 overflow-hidden bg-slate-100 border border-slate-200"
      style={!showImage ? { backgroundColor: getTemplatePreset(resume.templateSlug).primary } : undefined}
      aria-hidden
    >
      {showImage && (
        <img
          src={resume.thumbnailUrl}
          alt=""
          className="w-full h-full object-cover object-top"
          loading="lazy"
          onError={handleError}
        />
      )}
    </div>
  );
}

// A resume counts as "likely mid-generation" if it was edited very recently
// but its thumbnail hasn't caught up yet — either never generated, or
// generated before this latest edit (stale).
const POLL_CANDIDATE_WINDOW_MS = 30_000;
const isThumbnailPending = (resume) => {
  const updatedAt = new Date(resume.updatedAt).getTime();
  if (Date.now() - updatedAt > POLL_CANDIDATE_WINDOW_MS) return false;
  const generatedAt = resume.thumbnailGeneratedAt ? new Date(resume.thumbnailGeneratedAt).getTime() : null;
  return !generatedAt || generatedAt < updatedAt;
};

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { list } = useSelector((s) => s.resume);
  const { user } = useSelector((s) => s.auth);
  const { items: templates } = useSelector((s) => s.templates);
  const [showNew, setShowNew] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState('classic-blue');
  const [coverLetters, setCoverLetters] = useState([]);
  const [insight, setInsight] = useState(null);
  const plan = user?.subscription?.plan || 'free';

  // Thumbnail generation (on Builder-exit, or the self-healing retry below)
  // is fire-and-forget and takes a few seconds — a resume can land here, or
  // go stale here, with a thumbnailUrl that doesn't reflect the latest
  // generation yet. Rather than re-fetching the whole list (which would swap
  // `list`'s reference and, per the stagger-animation guard below, force
  // every card to remount and replay its entrance animation just because one
  // thumbnail changed), polled updates are kept in this separate map and
  // merged into each card's props at render time — `list` itself, and
  // therefore `gridKey`, never changes because of this.
  const [thumbnailOverrides, setThumbnailOverrides] = useState({});

  // De-dupes concurrent watchers for the same resume — both the "just
  // edited" candidate scan below and the self-healing onError path (further
  // down) can want to watch the same id, and this ensures only one poll
  // loop, and one regenerate request, is ever in flight for it at a time.
  const activeRef = useRef(new Set());
  // Reset on the setup side too, not just set on cleanup — StrictMode's
  // dev-only mount→cleanup→mount double-invoke would otherwise flip this to
  // true on the synthetic cleanup and leave it there forever, since nothing
  // would ever flip it back for the (real) remount that follows.
  const unmountedRef = useRef(false);
  useEffect(() => {
    unmountedRef.current = false;
    return () => { unmountedRef.current = true; };
  }, []);

  // Shared poller: watches one resume until its thumbnailGeneratedAt moves
  // on from `baselineGeneratedAt` (a real new generation landed) or a
  // bounded timeout elapses. Used both for resumes that were just edited
  // (below) and for resumes a card reports as broken (see
  // handleThumbnailBroken) — the same mechanism serves both cases, not two
  // parallel copies of it.
  const watchThumbnail = useCallback((resumeId, baselineGeneratedAt) => {
    if (activeRef.current.has(resumeId)) return;
    activeRef.current.add(resumeId);

    const POLL_INTERVAL_MS = 2000;
    const TIMEOUT_MS = 12_000;
    const startedAt = Date.now();

    const poll = async () => {
      if (unmountedRef.current) { activeRef.current.delete(resumeId); return; }
      const data = await resumeAPI.get(resumeId).then((r) => r.data).catch(() => null);
      if (unmountedRef.current) { activeRef.current.delete(resumeId); return; }

      // Completion is "has thumbnailGeneratedAt moved on from its baseline",
      // not "is thumbnailGeneratedAt >= updatedAt": the generation write
      // itself also bumps updatedAt (Mongoose's own timestamps), landing it
      // a few ms *after* thumbnailGeneratedAt, which would make that
      // comparison never resolve to "done" for the very write we're
      // waiting on.
      if (data?.thumbnailGeneratedAt &&
          (!baselineGeneratedAt || new Date(data.thumbnailGeneratedAt) > new Date(baselineGeneratedAt))) {
        setThumbnailOverrides((prev) => ({
          ...prev,
          [resumeId]: { thumbnailUrl: data.thumbnailUrl, thumbnailGeneratedAt: data.thumbnailGeneratedAt },
        }));
        activeRef.current.delete(resumeId);
        return;
      }

      if (Date.now() - startedAt < TIMEOUT_MS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        activeRef.current.delete(resumeId);
      }
    };

    setTimeout(poll, POLL_INTERVAL_MS);
  }, []);

  useEffect(() => {
    list.filter(isThumbnailPending).forEach((r) => watchThumbnail(r._id, r.thumbnailGeneratedAt || null));
  }, [list, watchThumbnail]);

  // Self-healing: a card's thumbnailUrl can be correct in the database but
  // point at a file that's gone missing (see the incident this fixes — local
  // thumbnail files deleted out from under valid DB references). When that
  // happens the <img> 404s and ResumeCardThumbnail reports it here — kick
  // off a regeneration (through the same throttled endpoint Builder-exit
  // uses, so a burst of simultaneously-broken thumbnails doesn't spam
  // Puppeteer) and, only if one was actually triggered, watch for it with
  // the exact same poller used for post-edit updates above.
  const handleThumbnailBroken = useCallback((resumeId, currentGeneratedAt) => {
    if (activeRef.current.has(resumeId)) return;
    activeRef.current.add(resumeId);
    resumeAPI
      .regenerateThumbnail(resumeId)
      .then((res) => {
        activeRef.current.delete(resumeId);
        if (res.status === 202) {
          watchThumbnail(resumeId, currentGeneratedAt);
        }
      })
      .catch(() => { activeRef.current.delete(resumeId); });
  }, [watchThumbnail]);

  // The resume grid below plays a stagger entrance animation keyed to
  // `animate="visible"` — a static prop that never toggles. If `list` gets a
  // new array reference (a second fetchResumes() resolving) while that
  // stagger is still mid-sequence, Framer's per-child propagation for
  // children whose individual delay hasn't elapsed yet is abandoned and
  // never retriggered, permanently stranding them at opacity:0 (only a full
  // remount clears it — this was the Dashboard card-invisibility bug).
  // Forcing a fresh `key` whenever `list`'s reference changes makes every
  // list update fully remount the grid instead of updating it in place, so
  // there's never a "some children already in flight, others not" state to
  // strand — each mount always starts every child from `hidden` and runs
  // the transition through uninterrupted. Computed during render (not an
  // effect) so the key is already correct in the same pass `list` changes,
  // with no extra render or visible flash of stale content.
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
    dispatch(fetchResumes());
    dispatch(fetchTemplates());
    if (plan === 'premium') {
      coverLetterAPI.list().then((r) => setCoverLetters(r.data)).catch(() => {});
    }
    if (['pro', 'premium'].includes(plan)) {
      resumeAPI.dashboardInsight().then((r) => setInsight(r.data)).catch(() => {});
    }
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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-brand-600 mb-1">Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-slate-600 mt-1">Manage resumes and pick templates for your next application.</p>
          </div>
          <button type="button" onClick={() => setShowNew(!showNew)} className="app-btn-primary shrink-0">
            <MotionIcon><Plus size={18} className="mr-2" /></MotionIcon>
            New resume
          </button>
        </div>

        <motion.div
          className="grid sm:grid-cols-3 gap-4 mb-8"
          initial="hidden"
          animate="visible"
          variants={staggerContainer()}
        >
          <motion.div variants={staggerItem} className="app-card p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 mb-2">
              <motion.span {...iconPopIn(0.1)}><FileText size={16} /></motion.span>
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumes</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{list.length}</p>
          </motion.div>
          <motion.div variants={staggerItem} className="app-card p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass/15 text-brass mb-2">
              <motion.span {...iconPopIn(0.15)}><Crown size={16} /></motion.span>
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
            <p className="text-3xl font-bold text-slate-900 mt-1 capitalize">{plan}</p>
          </motion.div>
          <motion.div variants={staggerItem} className="app-card p-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600 mb-2">
              <motion.span {...iconPopIn(0.2)}><LayoutTemplate size={16} /></motion.span>
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{templates.length || '—'}</p>
            <Link to="/pricing" className="text-sm text-brand-600 font-medium mt-2 inline-block hover:underline">
              Upgrade for more
            </Link>
          </motion.div>
        </motion.div>

        <InsightBanner insight={insight} />

        <AnimatePresence>
          {showNew && (
            <TemplatePickerModal
              templates={templates}
              selectedSlug={selectedSlug}
              onSelect={(tpl) => !tpl.locked && setSelectedSlug(tpl.slug)}
              onClose={() => setShowNew(false)}
              onCreate={createResume}
              isFirstResume={list.length === 0}
            />
          )}
        </AnimatePresence>

        {plan === 'premium' && coverLetters.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Mail size={18} className="text-brand-600" />
              Cover letters
            </h2>
            <div className="flex flex-wrap gap-2">
              {coverLetters.map((c) => (
                <Link
                  key={c._id}
                  to={`/cover-letter/${c._id}`}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your resumes</h2>
        <motion.div
          key={gridKey}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer()}
        >
          {list.map((r) => (
            <motion.article
              key={r._id}
              variants={staggerItem}
              className="app-card p-5 hover:border-brand-200 transition-colors"
            >
              <ResumeCardThumbnail
                key={thumbnailOverrides[r._id]?.thumbnailUrl ?? r.thumbnailUrl}
                resume={thumbnailOverrides[r._id] ? { ...r, ...thumbnailOverrides[r._id] } : r}
                onBroken={handleThumbnailBroken}
              />
              <h3 className="font-semibold text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1 capitalize">{r.templateSlug?.replace(/-/g, ' ')}</p>
              <p className="text-xs text-slate-400 mt-2">
                Updated {new Date(r.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <Link to={`/builder/${r._id}`} className="app-btn-primary flex-1 text-center !py-2 min-w-[80px]">
                  Edit
                </Link>
                <button
                  type="button"
                  title="Duplicate"
                  onClick={() => duplicateResume(r._id, r.title)}
                  className="app-btn-secondary !p-2"
                >
                  <MotionIcon><Copy size={18} /></MotionIcon>
                </button>
                {plan === 'premium' && (
                  <button
                    type="button"
                    title="Cover letter"
                    onClick={() => newCoverLetter(r._id)}
                    className="app-btn-secondary !p-2 text-brand-600"
                  >
                    <MotionIcon><Mail size={18} /></MotionIcon>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteResume(r._id)}
                  className="app-btn-secondary !p-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <MotionIcon><Trash2 size={18} /></MotionIcon>
                </button>
              </div>
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
      </div>
    </DashboardLayout>
  );
}
