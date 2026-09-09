import { useCallback, useEffect, useState } from 'react';
import { Check, X, Clock, RefreshCw, Inbox } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Skeleton from '../components/common/Skeleton';
import { adminAPI } from '../services/api';
import { formatPlanPrice } from '../utils/plans';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';

// A locally-stored receipt comes back as "/uploads/xxx" (served by the API
// origin, not the frontend). Cloudinary URLs are already absolute.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
const resolveReceiptUrl = (u) => (u && u.startsWith('/uploads') ? `${API_ORIGIN}${u}` : u);

const TABS = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
];

const STATUS_STYLE = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminPurchaseRequestsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [tab, setTab] = useState('pending');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  // bumped to force a refetch (Refresh button, after approve/reject)
  const [reloadKey, setReloadKey] = useState(0);
  // id of the request whose approve/reject call is in flight
  const [actingId, setActingId] = useState(null);

  // Fetch whenever the tab changes or a reload is requested. setState only
  // happens in the async callbacks (never synchronously in the effect body),
  // so the skeleton is driven by setLoading(true) in the event handlers that
  // change `tab` / `reloadKey` instead.
  useEffect(() => {
    let cancelled = false;
    adminAPI
      .purchaseRequests(tab)
      .then(({ data }) => {
        if (!cancelled) setRequests(data?.requests || []);
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(err.response?.data?.message || 'Could not load requests');
        setRequests([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab, reloadKey, toast]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const selectTab = (id) => {
    if (id === tab) return;
    setLoading(true);
    setTab(id);
  };

  const handleApprove = async (req) => {
    const ok = await confirmDialog({
      title: `Approve ${req.user?.email || 'user'}?`,
      message: `Their plan becomes ${req.plan.toUpperCase()} for ${req.durationDays} days, effective now.`,
      confirmLabel: 'Approve',
    });
    if (!ok) return;
    setActingId(req._id);
    try {
      const { data } = await adminAPI.approveRequest(req._id);
      toast.success(data?.message || 'Approved');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approve failed');
    } finally {
      setActingId(null);
    }
  };

  const handleReject = async (req) => {
    const note = await confirmDialog({
      title: `Reject ${req.user?.email || 'user'}?`,
      message: 'Optionally add a reason the user will see on the pricing page.',
      inputMode: true,
      inputLabel: 'Reason (optional)',
      confirmLabel: 'Reject',
      cancelLabel: 'Cancel',
      destructive: true,
    });
    if (note === null) return;
    setActingId(req._id);
    try {
      await adminAPI.rejectRequest(req._id, note);
      toast.success('Request rejected');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reject failed');
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium text-brand-600 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Purchase Requests
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Review paid-plan requests. Approving activates the plan immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={reload}
            className="app-btn-secondary !py-2 gap-2 shrink-0"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTab(t.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} shape="rounded" className="w-full" height={64} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <Inbox size={32} className="mx-auto text-slate-300" />
            <p className="text-slate-500 mt-3 text-sm">No {tab} requests.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[880px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-slate-600">
                    <th className="py-3 px-4 font-medium">User</th>
                    <th className="py-3 px-4 font-medium">Current → Requested</th>
                    <th className="py-3 px-4 font-medium">Amount</th>
                    <th className="py-3 px-4 font-medium">Screenshot</th>
                    <th className="py-3 px-4 font-medium">Reference</th>
                    <th className="py-3 px-4 font-medium">Submitted</th>
                    <th className="py-3 px-4 font-medium text-right">
                      {tab === 'pending' ? 'Actions' : 'Reviewed'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => {
                    const currentPlan = req.user?.subscription?.plan || 'free';
                    const busy = actingId === req._id;
                    return (
                      <tr key={req._id} className="border-b border-slate-100 last:border-0 align-top">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{req.user?.name || '—'}</div>
                          <div className="text-slate-500 text-xs">{req.user?.email || '—'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="capitalize text-slate-500">{currentPlan}</span>
                          <span className="mx-1.5 text-slate-400">→</span>
                          <span className="capitalize font-semibold text-slate-900">{req.plan}</span>
                          <span
                            className={`ml-2 inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[req.status]}`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {formatPlanPrice(req.amount)}
                          <span className="text-slate-400 text-xs">/mo</span>
                        </td>
                        <td className="py-3 px-4">
                          {req.receiptUrl ? (
                            <a
                              href={resolveReceiptUrl(req.receiptUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="block h-14 w-14 overflow-hidden rounded-md border border-slate-200 hover:border-brand-400"
                              title="Open full screenshot"
                            >
                              <img
                                src={resolveReceiptUrl(req.receiptUrl)}
                                alt="Payment screenshot"
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[180px] break-words">
                          {req.reference || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {fmtDate(req.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          {req.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleApprove(req)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(req)}
                                disabled={busy}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <X size={14} /> Reject
                              </button>
                            </div>
                          ) : (
                            <div className="text-right text-slate-500 text-xs">
                              <div className="flex items-center justify-end gap-1">
                                <Clock size={12} />
                                {fmtDate(req.reviewedAt)}
                              </div>
                              {req.reviewedBy?.email && (
                                <div className="text-slate-400">by {req.reviewedBy.email}</div>
                              )}
                              {req.reviewNote && (
                                <div className="text-slate-500 mt-1 italic">“{req.reviewNote}”</div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
