import { Star } from 'lucide-react';

// A locally-stored photo comes back as "/uploads/xxx" (served by the API
// origin, not the frontend) — same handling as receipts in the admin page.
const API_ORIGIN = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '');
export const resolveImageUrl = (u) => (u && u.startsWith('/uploads') ? `${API_ORIGIN}${u}` : u);

export function Stars({ value, size = 16 }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </div>
  );
}

export function Avatar({ name, image, size = 44 }) {
  const src = resolveImageUrl(image);
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-brand-50 text-brand-600 font-semibold flex items-center justify-center shrink-0"
    >
      {(name || '?').trim().charAt(0).toUpperCase()}
    </div>
  );
}
