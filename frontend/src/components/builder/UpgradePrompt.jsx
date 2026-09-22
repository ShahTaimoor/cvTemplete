import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Lock, X } from 'lucide-react';

export default function UpgradePrompt({ feature, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade required"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl border border-slate-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
        >
          <X size={18} />
        </button>
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Lock size={22} />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Paid feature</h3>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{feature}</span> isn&apos;t available on the Free plan.
          Please pay and choose a paid plan to use it.
        </p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="app-btn-secondary flex-1">
            Not now
          </button>
          <Link to="/pricing" className="app-btn-primary flex-1 justify-center">
            Choose a plan
          </Link>
        </div>
      </div>
    </div>
  );
}
