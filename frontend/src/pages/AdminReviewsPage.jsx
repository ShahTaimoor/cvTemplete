import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Skeleton from '../components/common/Skeleton';
import ReviewForm from '../components/reviews/ReviewForm';
import { Stars, Avatar } from '../components/reviews/reviewUtils';
import { adminAPI } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';

const TABS = ['pending', 'approved', 'rejected', 'all'];
const EMPTY = { name: '', role: '', rating: 5, text: '', image: '' };

export default function AdminReviewsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [status, setStatus] = useState('pending');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  // null = form closed, EMPTY = adding, a review = editing it
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminAPI
      .reviews(status)
      .then(({ data }) => setReviews(data?.reviews || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load reviews'))
      .finally(() => setLoading(false));
  }, [status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (form) => {
    setSaving(true);
    try {
      if (editing._id) await adminAPI.updateReview(editing._id, form);
      else await adminAPI.createReview(form);
      toast.success(editing._id ? 'Review updated' : 'Review added');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save review');
    } finally {
      setSaving(false);
    }
  };

  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const remove = async (r) => {
    const ok = await confirmDialog({
      title: 'Delete this review?',
      message: `Review by ${r.name} will be removed permanently.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) act(() => adminAPI.deleteReview(r._id), 'Review deleted');
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium text-brand-600 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Reviews
            </h1>
            <p className="text-slate-600 mt-1 mb-6 text-sm">
              Approve what users submit, or add your own testimonials. Approved reviews show on the landing page.
            </p>
          </div>
          {!editing && (
            <button className="app-btn-primary gap-2 shrink-0" onClick={() => setEditing(EMPTY)}>
              <Plus size={16} /> Add review
            </button>
          )}
        </div>

        {editing && (
          <div className="app-card p-5 mb-6">
            <h2 className="font-semibold text-slate-900 mb-4">{editing._id ? 'Edit review' : 'Add review'}</h2>
            <ReviewForm
              key={editing._id || 'new'}
              initial={{
                name: editing.name,
                role: editing.role || '',
                rating: editing.rating,
                text: editing.text,
                image: editing.image || '',
              }}
              saving={saving}
              submitLabel="Save"
              onCancel={() => setEditing(null)}
              onSave={save}
            />
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setStatus(t)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                status === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton shape="rounded" className="h-40 w-full" />
        ) : reviews.length === 0 ? (
          <p className="text-slate-500 text-sm">No {status === 'all' ? '' : status} reviews.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r._id} className="app-card p-4 flex gap-4">
                <Avatar name={r.name} image={r.image} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 text-sm">{r.name}</p>
                    {r.role && <span className="text-xs text-slate-500">{r.role}</span>}
                    <span className="text-xs rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 capitalize">
                      {r.status}
                    </span>
                  </div>
                  <Stars value={r.rating} size={14} />
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{r.text}</p>
                  {r.user?.email && <p className="text-xs text-slate-400 mt-1">Submitted by {r.user.email}</p>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {r.status !== 'approved' && (
                    <button
                      className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50"
                      title="Approve"
                      onClick={() => act(() => adminAPI.approveReview(r._id), 'Review approved')}
                    >
                      <Check size={16} />
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      className="p-1.5 rounded text-amber-600 hover:bg-amber-50"
                      title="Reject"
                      onClick={() => act(() => adminAPI.rejectReview(r._id), 'Review rejected')}
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    className="p-1.5 rounded text-slate-500 hover:bg-slate-100"
                    title="Edit"
                    onClick={() => setEditing(r)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button className="p-1.5 rounded text-red-600 hover:bg-red-50" title="Delete" onClick={() => remove(r)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
