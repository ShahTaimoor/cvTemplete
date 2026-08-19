import { useState } from 'react';
import { Check, X, Sparkles, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { PLANS, formatPlanPrice, CURRENCY_LABEL, BILLING_PERIOD_LABEL } from '../utils/plans';
import { subscriptionAPI } from '../services/api';
import { fetchMe } from '../store/authSlice';
import DashboardLayout from '../components/layout/DashboardLayout';
import Skeleton from '../components/common/Skeleton';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';

const COMPARE_ROWS = [
  { label: 'Resume templates', free: '2', basic: '12+', pro: '55+', premium: '330+' },
  { label: 'PDF export', free: true, basic: true, pro: true, premium: true },
  { label: 'Color customization', free: false, basic: false, pro: true, premium: true },
  { label: 'ATS checker', free: false, basic: false, pro: true, premium: true },
  { label: 'Drag & drop sections', free: false, basic: false, pro: true, premium: true },
  { label: 'Share link', free: false, basic: false, pro: false, premium: true },
  { label: 'Cover letters', free: false, basic: false, pro: false, premium: true },
];

function CellValue({ value }) {
  if (value === true) return <Check size={18} className="text-emerald-600 mx-auto" />;
  if (value === false) return <X size={18} className="text-slate-300 mx-auto" />;
  return <span className="text-sm font-medium text-slate-700">{value}</span>;
}

// Shape-matched placeholder for the plan cards, shown only while auth state
// is still resolving (see `authChecked` below) — mirrors the real card's
// header/price/badge/feature-list/button layout instead of a generic block.
function PricingCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 sm:p-7">
      <div className="mb-5 space-y-2">
        <Skeleton shape="rounded" width="50%" height={22} />
        <Skeleton shape="rounded" width="75%" height={14} />
      </div>
      <Skeleton shape="rounded" width="45%" height={38} className="mb-5" />
      <Skeleton shape="rounded" className="w-full mb-5" height={34} />
      <div className="space-y-3 mb-8 flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} shape="rounded" width={i % 2 === 0 ? '90%' : '75%'} height={14} />
        ))}
      </div>
      <Skeleton shape="rounded" className="w-full" height={46} />
    </div>
  );
}

/** What a user on `planId` actually loses by dropping to Free, sourced from
 * the real compare-table gates (not the marketing feature bullets). */
function getDowngradeLosses(planId) {
  if (planId === 'free') return [];
  const current = PLANS.find((p) => p.id === planId);
  const free = PLANS.find((p) => p.id === 'free');
  if (!current) return [];

  const losses = [`${current.templates}+ templates (down to ${free.templates})`];
  COMPARE_ROWS.forEach((row) => {
    if (typeof row[planId] !== 'boolean') return;
    if (row[planId] && !row.free) losses.push(row.label);
  });
  if (planId === 'premium') losses.push('Country CV formats');

  return losses;
}

export default function PricingPage() {
  const { user, authChecked } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const confirmDialog = useConfirm();
  const currentPlan = user?.subscription?.plan || 'free';
  // Plan id whose upgrade/downgrade request is currently in flight (or the
  // sentinel 'free' for a downgrade), or null when idle — drives both the
  // disabled/loading state on the clicked button and the double-click guard
  // below, since `subscriptionAPI.upgrade` has no other in-flight tracking.
  const [upgradingId, setUpgradingId] = useState(null);

  const handleDowngrade = async () => {
    const losses = getDowngradeLosses(currentPlan);
    setUpgradingId('free');
    const ok = await confirmDialog({
      title: 'Downgrade to Free plan?',
      message: `You'll lose: ${losses.join(', ')}. This takes effect immediately.`,
      confirmLabel: 'Downgrade to Free',
      cancelLabel: 'Cancel',
      destructive: true,
    });
    if (!ok) {
      setUpgradingId(null);
      return;
    }
    try {
      await subscriptionAPI.upgrade('free');
      dispatch(fetchMe());
      toast.success('Downgraded to Free plan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Downgrade failed');
    } finally {
      setUpgradingId(null);
    }
  };

  const handleUpgrade = async (planId) => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (upgradingId) return;
    if (planId === 'free') {
      await handleDowngrade();
      return;
    }
    setUpgradingId(planId);
    try {
      await subscriptionAPI.upgrade(planId);
      dispatch(fetchMe());
      const planName = PLANS.find((p) => p.id === planId)?.name || planId;
      toast.success(`Upgraded to ${planName} successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setUpgradingId(null);
    }
  };

  // Wait for the initial /me check (dispatched on app mount) to settle
  // before committing to either the logged-in (DashboardLayout) or public
  // shell, and before rendering plan-dependent content like "Current plan"
  // highlighting. Without this, a hard refresh on /pricing while genuinely
  // logged in briefly rendered the public shell and un-highlighted cards
  // (since `user` starts null), then flipped once fetchMe() resolved. This
  // only ever blocks on a real, fast-resolving check — for a logged-out
  // visitor fetchMe() still settles authChecked (to `user: null`) almost
  // immediately, so pricing shows correctly and promptly for them too.
  if (!authChecked) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-4">
            <Skeleton shape="rounded" width={120} height={26} className="mx-auto" />
            <Skeleton shape="rounded" width="60%" height={40} className="mx-auto" />
            <Skeleton shape="rounded" width="80%" height={20} className="mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-5 items-stretch mb-16 lg:mb-20">
            {PLANS.map((plan) => (
              <PricingCardSkeleton key={plan.id} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 mb-4 border border-brand-100">
          <Sparkles size={14} />
          {CURRENCY_LABEL}
        </span>
        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-medium text-brand-600 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Simple monthly plans
        </h1>
        <p className="text-slate-600 mt-4 text-base sm:text-lg leading-relaxed">
          Start free, then upgrade when you need more templates and tools. Paid plans are billed per month in PKR.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-5 items-stretch mb-16 lg:mb-20">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.popular;
          const isBusy = upgradingId === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 sm:p-7 transition-shadow ${
                isPopular
                  ? 'border-burgundy shadow-lg shadow-burgundy/10 xl:scale-[1.03] xl:z-10'
                  : 'border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-burgundy text-white px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
                  Most popular
                </span>
              )}

              <div className="mb-5">
                <h2 className="text-xl font-bold text-graphite">{plan.name}</h2>
                <p className="text-sm text-slate-600 mt-1">{plan.tagline}</p>
              </div>

              <div className="mb-1">
                <span className="text-4xl sm:text-[2.5rem] font-bold text-graphite tracking-tight">
                  {formatPlanPrice(plan.price)}
                </span>
                {plan.price > 0 && (
                  <span className="text-slate-600 text-sm font-medium ml-1">/ {BILLING_PERIOD_LABEL}</span>
                )}
              </div>
              <div className="mb-4" />

              <p className="text-sm font-medium text-brand-700 bg-brand-50/80 rounded-lg px-3 py-2 mb-5 border border-brand-100">
                {plan.templates} templates included
              </p>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check size={16} className="text-brand-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent || !!upgradingId}
                onClick={() => handleUpgrade(plan.id)}
                className={
                  isCurrent
                    ? 'w-full py-3 rounded-xl bg-slate-100 text-slate-500 font-semibold text-sm cursor-default'
                    : isPopular
                      ? 'app-btn-primary w-full !py-3 !rounded-xl gap-2 disabled:opacity-50'
                      : 'app-btn-secondary w-full !py-3 !rounded-xl gap-2 disabled:opacity-50'
                }
              >
                {isBusy && <Loader2 size={16} className="animate-spin" />}
                {isCurrent
                  ? 'Current plan'
                  : isBusy
                    ? plan.price === 0
                      ? 'Downgrading...'
                      : 'Upgrading...'
                    : plan.price === 0
                      ? 'Get started free'
                      : 'Upgrade now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Compare table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 sm:px-8 py-5 border-b border-slate-200 bg-slate-50/80">
          <h2 className="text-lg font-bold text-graphite">Compare all features</h2>
          <p className="text-sm text-slate-600 mt-1">See what each plan includes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="text-left py-4 px-6 font-medium text-slate-600 w-[40%]">Feature</th>
                {PLANS.map((p) => (
                  <th
                    key={p.id}
                    className={`py-4 px-4 text-center font-semibold min-w-[100px] ${
                      p.popular ? 'text-burgundy bg-burgundy/5' : 'text-graphite'
                    }`}
                  >
                    <span className="block">{p.name}</span>
                    <span className="block text-xs font-normal text-slate-600 mt-0.5">
                      {formatPlanPrice(p.price)}
                      {p.price > 0 ? '/mo' : ''}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                >
                  <td className="py-3.5 px-6 text-graphite font-medium">{row.label}</td>
                  <td className="py-3.5 px-4 text-center">
                    <CellValue value={row.free} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <CellValue value={row.basic} />
                  </td>
                  <td className="py-3.5 px-4 text-center bg-burgundy/5">
                    <CellValue value={row.pro} />
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <CellValue value={row.premium} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-center text-xs text-slate-500 mt-6 max-w-xl mx-auto leading-relaxed">
        Prices shown in PKR (Rs.). Demo upgrades apply instantly; connect your payment provider for live billing.
      </p>

      {!user && (
        <p className="text-center text-sm text-slate-600 mt-8">
          <Link to="/register" className="font-semibold text-brand-600 hover:underline">
            Create a free account
          </Link>{' '}
          — no card required to start.
        </p>
      )}
    </div>
  );

  return user ? (
    <DashboardLayout>{content}</DashboardLayout>
  ) : (
    <div className="bg-slate-50 min-h-screen">{content}</div>
  );
}
