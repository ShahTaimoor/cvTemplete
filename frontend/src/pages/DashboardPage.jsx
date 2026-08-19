import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, FileText, Crown, LayoutTemplate, Eye, Clock, Download, TrendingUp } from 'lucide-react';
import { fetchResumes } from '../store/resumeSlice';
import { fetchTemplates } from '../store/templateSlice';
import { resumeAPI } from '../services/api';
import TemplatePickerModal from '../components/dashboard/TemplatePickerModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem, pageFade, iconPopIn } from '../lib/motion';
import MotionIcon from '../components/common/MotionIcon';
import Skeleton from '../components/common/Skeleton';

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

// Shape-matched placeholders for the loading state above — shown only while
// the data they stand in for is genuinely still in flight (see
// resumesLoaded/templatesLoaded/insightLoaded below), never as a fabricated
// delay. InsightBannerSkeleton approximates the wider of the two real
// InsightBanner variants (the chip row) since which one will land isn't
// known yet.
function StatCardSkeleton() {
  return (
    <div className="app-card p-5">
      <Skeleton shape="rounded" width={32} height={32} className="mb-2" />
      <Skeleton shape="rounded" width={90} height={10} className="mb-2.5" />
      <Skeleton shape="rounded" width={56} height={28} />
    </div>
  );
}

function InsightBannerSkeleton() {
  return (
    <div className="mb-8 rounded-xl border border-burgundy/20 bg-burgundy/5 px-4 py-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <Skeleton shape="rounded" width={28} height={28} />
        <Skeleton shape="rounded" width={150} height={10} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton shape="rounded" width={150} height={32} />
        <Skeleton shape="rounded" width={130} height={32} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { list } = useSelector((s) => s.resume);
  const { user } = useSelector((s) => s.auth);
  const { items: templates } = useSelector((s) => s.templates);
  const [showNew, setShowNew] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState('classic-blue');
  const [insight, setInsight] = useState(null);
  const plan = user?.subscription?.plan || 'free';

  // Start true (not derived from list/templates.length, which are both `[]`
  // whether "still loading" or "genuinely empty") and flip false once each
  // fetch has actually settled — the only way to distinguish "haven't
  // loaded yet" from "loaded, and there's nothing there" so the skeleton
  // shows for a genuine load and never lingers or flashes incorrectly.
  const [resumesLoaded, setResumesLoaded] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [insightLoaded, setInsightLoaded] = useState(false);

  // Guards against dispatching the same fetch twice for the same (dispatch,
  // plan) pair — most notably React StrictMode's dev-only mount→cleanup→
  // mount double-invoke, which would otherwise fire fetchResumes() twice
  // ~200ms apart. A genuine remount (e.g. leaving and returning to the
  // route) gets a fresh ref and still fetches normally; a real plan change
  // still refetches too, since that changes the guarded key.
  const fetchedForPlanRef = useRef(null);
  useEffect(() => {
    if (fetchedForPlanRef.current === plan) return;
    fetchedForPlanRef.current = plan;
    dispatch(fetchResumes()).finally(() => setResumesLoaded(true));
    dispatch(fetchTemplates()).finally(() => setTemplatesLoaded(true));
    if (['pro', 'premium'].includes(plan)) {
      resumeAPI.dashboardInsight().then((r) => setInsight(r.data)).catch(() => {}).finally(() => setInsightLoaded(true));
    } else {
      setInsightLoaded(true);
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

        {!resumesLoaded || !templatesLoaded ? (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
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
        )}

        {['pro', 'premium'].includes(plan) && !insightLoaded ? (
          <InsightBannerSkeleton />
        ) : (
          <InsightBanner insight={insight} />
        )}

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
      </div>
    </DashboardLayout>
  );
}
