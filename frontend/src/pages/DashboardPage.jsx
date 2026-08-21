import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, FileText, Crown, LayoutTemplate, Eye, Clock, Download, TrendingUp, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchResumes } from '../store/resumeSlice';
import { fetchTemplates } from '../store/templateSlice';
import { resumeAPI } from '../services/api';
import TemplatePickerModal from '../components/dashboard/TemplatePickerModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem, pageFade, iconPopIn, DURATION, EASE } from '../lib/motion';
import MotionIcon from '../components/common/MotionIcon';
import Skeleton from '../components/common/Skeleton';

const DESKTOP_ACTIVITY_PAGE_SIZE = 4;
const MOBILE_ACTIVITY_PAGE_SIZE = 1;
// Matches Tailwind's default `sm` breakpoint (40rem/640px), already used
// throughout this app via the `sm:` prefix — kept as a literal px value
// here since matchMedia needs a real media-query string, not a Tailwind
// class. 4 chips sharing one row's width only leaves room for a couple of
// truncated characters per title on a phone screen (the actual reported
// bug), so below this width each page holds just 1 item at full width
// instead.
const MOBILE_BREAKPOINT_PX = 640;

// Slide direction is tracked explicitly (not inferred from old/new page
// inside the variant) since Framer Motion's `custom` needs a plain value
// available to both the entering and exiting element at the moment each is
// evaluated — arrows always move ±1, but a dot click can jump several pages
// at once, so direction is resolved once in `goToPage` from the actual
// page delta, not assumed from which control was used.
const carouselVariants = {
  enter: (direction) => ({ x: direction > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -24 : 24, opacity: 0 }),
};

// matchMedia (not a resize listener) so this only re-renders on an actual
// breakpoint crossing, not on every pixel of a drag-resize — and it fires
// on orientation change too, since that's also just a viewport-width change
// as far as the media query is concerned.
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT_PX
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

/**
 * Paginated, arrow+dot carousel for the activity chips — replaces the
 * earlier raw overflow-x-auto scroll strip. Grouped into fixed-size pages
 * (4 items on desktop/tablet, 1 on mobile — see useIsMobile above) so the
 * row's height never depends on how many items exist, and each page's
 * chips are laid out on a CSS grid sized to the page's own item count (not
 * always the full page size) so a shorter final page doesn't leave
 * stretched-out empty cells. No scroll affordance anywhere — arrows/dots
 * are the only way to move between pages, deliberately reading as a
 * carousel rather than a scrollable strip.
 */
function ActivityCarousel({ items }) {
  const isMobile = useIsMobile();
  const pageSize = isMobile ? MOBILE_ACTIVITY_PAGE_SIZE : DESKTOP_ACTIVITY_PAGE_SIZE;
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const pages = [];
  for (let i = 0; i < items.length; i += pageSize) {
    pages.push(items.slice(i, i + pageSize));
  }
  const totalPages = pages.length;
  // Crossing the mobile breakpoint changes what a "page" even means (1
  // item vs. 4), so page indices from one layout aren't meaningful in the
  // other — this just guards against the now-stale index pointing past
  // the end of the freshly-recomputed `pages` array. Also covers `items`
  // itself changing length for any other reason.
  useEffect(() => {
    setPage((p) => Math.max(0, Math.min(p, totalPages - 1)));
  }, [totalPages]);
  const currentPage = pages[page] || pages[0];

  const goToPage = (target) => {
    const clamped = Math.max(0, Math.min(totalPages - 1, target));
    if (clamped === page) return;
    setDirection(clamped > page ? 1 : -1);
    setPage(clamped);
  };

  return (
    <div>
      <div className="flex items-center gap-1">
        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page === 0}
            aria-label="Previous items"
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-burgundy hover:bg-burgundy/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="flex-1 min-w-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={carouselVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: DURATION.base, ease: EASE }}
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${currentPage.length}, minmax(0, 1fr))` }}
            >
              {currentPage.map((item, i) => {
                const isCoverLetter = item.type === 'coverLetter';
                const TypeIcon = isCoverLetter ? Mail : FileText;
                const href = isCoverLetter ? `/cover-letter/${item.id}` : `/builder/${item.id}`;
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={href}
                    className="flex items-center gap-2 rounded-lg border border-burgundy/15 bg-white px-3 py-1.5 min-w-0 hover:border-burgundy/35 transition-colors"
                  >
                    <TypeIcon size={12} className="text-burgundy/60 shrink-0" />
                    <span className="text-sm font-medium text-graphite truncate flex-1 min-w-0">{item.title}</span>
                    {item.views > 0 && (
                      <span className="flex items-center gap-1 text-xs text-burgundy shrink-0">
                        <motion.span {...iconPopIn(0.05 + i * 0.05)}><Eye size={13} /></motion.span> {item.views}
                      </span>
                    )}
                    {item.downloads > 0 && (
                      <span className="flex items-center gap-1 text-xs text-burgundy shrink-0">
                        <motion.span {...iconPopIn(0.05 + i * 0.05)}><Download size={13} /></motion.span> {item.downloads}
                      </span>
                    )}
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {totalPages > 1 && (
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages - 1}
            aria-label="Next items"
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-burgundy hover:bg-burgundy/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToPage(i)}
              aria-label={`Go to page ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === page ? 'w-4 bg-burgundy' : 'w-1.5 bg-burgundy/25 hover:bg-burgundy/45'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// One real, data-backed nudge for Pro/Premium accounts (see GET
// /resumes/dashboard-insight) — never a generic filler. Renders nothing at
// all for `type: 'none'`, not an empty placeholder box. Burgundy is the
// brand's reserved Pro/Premium-indicator accent (see index.css), matching
// how it's already used for the Premium plan card on Pricing.
//
// 'activity' shows every resume AND cover letter with real views/downloads
// this week (not just the single busiest item, and not just Resumes — see
// GET /resumes/dashboard-insight, which now merges both content types, up
// to 6 of each) as a paginated, arrow+dot carousel (see ActivityCarousel
// above) rather than a scrollable strip — grouped into fixed pages so this
// section's height never depends on item count. Each chip is a Link to its
// item's actual edit page (Builder for resumes, the Cover Letter editor
// for cover letters) — the small leading icon disambiguates the two types
// at a glance, since a title alone can't. 'stale' is a simpler, single-
// line fallback for when nothing happened this week at all — a different,
// gentler kind of nudge, so it keeps its own layout rather than being
// forced into the chip treatment.
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
        <ActivityCarousel items={insight.items} />
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
        It's been {insight.daysSinceUpdate} days since you updated {insight.title}
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
      <div className="flex gap-2">
        <Skeleton shape="rounded" width={150} height={32} className="shrink-0" />
        <Skeleton shape="rounded" width={130} height={32} className="shrink-0" />
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
        <motion.div
          initial={pageFade.initial}
          animate={pageFade.animate}
          transition={pageFade.transition}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-sm font-semibold text-brass-ink mb-1">Dashboard</p>
            <h1
              className="text-2xl sm:text-3xl font-medium text-slate-900 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-slate-600 mt-1">Manage resumes and pick templates for your next application.</p>
          </div>
          <button type="button" onClick={() => setShowNew(!showNew)} className="app-btn-primary shrink-0">
            <MotionIcon><Plus size={18} className="mr-2" /></MotionIcon>
            New resume
          </button>
        </motion.div>

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
