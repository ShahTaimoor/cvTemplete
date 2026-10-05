import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { X, Quote } from 'lucide-react';
import { reviewAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import ReviewForm from './ReviewForm';
import { Stars, Avatar } from './reviewUtils';

function WriteReviewModal({ user, onClose }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const save = async (form) => {
    setSaving(true);
    try {
      await reviewAPI.submit(form);
      toast.success('Thanks! Your review will appear once it is approved.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="app-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Write a review</h3>
          <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <ReviewForm
          initial={{ name: user?.name || '', role: '', rating: 5, text: '', image: '' }}
          saving={saving}
          submitLabel="Submit review"
          onCancel={onClose}
          onSave={save}
        />
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const user = useSelector((s) => s.auth.user);
  const [reviews, setReviews] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    reviewAPI.list().then(({ data }) => setReviews(data?.reviews || [])).catch(() => {});
  }, []);

  return (
    <section className="border-t border-slate-200 bg-mist">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl font-medium text-brand-600 text-center" style={{ fontFamily: 'var(--font-display)' }}>
          What our users say
        </h2>
        <p className="text-center text-slate-600 mt-2 mb-10">
          Real feedback from people who built their resume with us.
        </p>

        {reviews.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((r) => (
              <figure key={r._id} className="app-card p-5 flex flex-col gap-3 bg-white">
                <div className="flex items-center justify-between">
                  <Stars value={r.rating} />
                  <Quote size={18} className="text-brand-100" />
                </div>
                <blockquote className="text-slate-700 text-sm leading-relaxed flex-1">{r.text}</blockquote>
                <figcaption className="flex items-center gap-3 pt-2 border-t border-slate-100">
                  <Avatar name={r.name} image={r.image} />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{r.name}</p>
                    {r.role && <p className="text-xs text-slate-500 truncate">{r.role}</p>}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 text-sm">
            No reviews yet — be the first to share your experience.
          </p>
        )}

        <div className="text-center mt-10">
          {user ? (
            <button className="app-btn-primary" onClick={() => setOpen(true)}>Write a review</button>
          ) : (
            <Link to="/login" className="app-btn-primary">Sign in to write a review</Link>
          )}
        </div>
      </div>
      {open && <WriteReviewModal user={user} onClose={() => setOpen(false)} />}
    </section>
  );
}
