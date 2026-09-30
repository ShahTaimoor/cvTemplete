import { useEffect, useState } from 'react';
import { Gift, Loader2 } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Skeleton from '../components/common/Skeleton';
import { adminAPI } from '../services/api';
import { useToast } from '../hooks/useToast';

// ISO string -> value for <input type="datetime-local"> (browser local time).
const toInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

function StatusBanner({ data }) {
  // Captured once per mount so render stays pure.
  const [now] = useState(() => Date.now());
  if (!data?.enabled || !data.startsAt || !data.endsAt) {
    return (
      <p className="rounded-lg bg-slate-100 text-slate-600 text-sm px-4 py-3">
        No free period is set. Users pay for plans as usual.
      </p>
    );
  }
  const start = new Date(data.startsAt).getTime();
  const end = new Date(data.endsAt).getTime();
  if (now < start) {
    return (
      <p className="rounded-lg bg-amber-50 text-amber-800 text-sm px-4 py-3">
        Scheduled — all plans become free on <strong>{formatDate(data.startsAt)}</strong>.
      </p>
    );
  }
  if (now <= end) {
    return (
      <p className="rounded-lg bg-emerald-50 text-emerald-800 text-sm px-4 py-3">
        Running now — all plans are free until <strong>{formatDate(data.endsAt)}</strong>.
      </p>
    );
  }
  return (
    <p className="rounded-lg bg-slate-100 text-slate-600 text-sm px-4 py-3">
      The last free period ended on {formatDate(data.endsAt)}.
    </p>
  );
}

export default function AdminFreePeriodPage() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apply = (fp) => {
    setData(fp);
    setEnabled(Boolean(fp.enabled));
    setStartsAt(toInputValue(fp.startsAt));
    setEndsAt(toInputValue(fp.endsAt));
  };

  useEffect(() => {
    adminAPI
      .freePeriod()
      .then(({ data: fp }) => apply(fp))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load free period'))
      .finally(() => setLoading(false));
  }, [toast]);

  const save = async (e) => {
    e.preventDefault();
    if (enabled && (!startsAt || !endsAt)) {
      toast.error('Choose both a start and an end date');
      return;
    }
    if (enabled && new Date(endsAt) <= new Date(startsAt)) {
      toast.error('End date must be after the start date');
      return;
    }
    setSaving(true);
    try {
      const { data: fp } = await adminAPI.saveFreePeriod({
        enabled,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      });
      apply(fp);
      toast.success('Free period saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save free period');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1
          className="text-2xl sm:text-3xl font-medium text-brand-600 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Free Period
        </h1>
        <p className="text-slate-600 mt-1 mb-6 text-sm">
          Make every plan free between two dates. During this time all users get full Premium
          access; when it ends, accounts return to the plan they actually bought.
        </p>

        {loading ? (
          <Skeleton shape="rounded" className="h-56 w-full" />
        ) : (
          <form onSubmit={save} className="app-card p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                <Gift size={20} />
              </div>
              <StatusBanner data={data} />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Enable free period
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="app-label" htmlFor="fp-from">Free from</label>
                <input
                  id="fp-from"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="app-input"
                />
              </div>
              <div>
                <label className="app-label" htmlFor="fp-to">Free until</label>
                <input
                  id="fp-to"
                  type="datetime-local"
                  value={endsAt}
                  min={startsAt || undefined}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="app-input"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="app-btn-primary gap-2" disabled={saving}>
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
