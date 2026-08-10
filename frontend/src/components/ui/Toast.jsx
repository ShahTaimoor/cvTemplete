import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    className: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    iconClassName: 'text-emerald-600',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200 text-red-700',
    iconClassName: 'text-red-600',
  },
  info: {
    icon: Info,
    className: 'bg-brand-50 border-brand-100 text-brand-700',
    iconClassName: 'text-brand-600',
  },
};

function ToastItem({ toast, onDismiss }) {
  const variant = VARIANTS[toast.type] || VARIANTS.info;
  const Icon = variant.icon;

  return (
    <div
      role="status"
      className={`pointer-events-auto flex items-start gap-2.5 w-full max-w-sm rounded-lg border shadow-lg px-4 py-3 ${variant.className}`}
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${variant.iconClassName}`} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
