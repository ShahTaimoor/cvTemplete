import { Shield } from 'lucide-react';

/** Small circular emblem — the brand's recurring "seal of trust" signature,
 * reserved for burgundy per the approved concept (Pro/Premium + trust marks). */
export default function Seal({ size = 40, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-burgundy text-mist ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="absolute -inset-1 rounded-full border border-burgundy/30" />
      <Shield size={size * 0.5} strokeWidth={2} />
    </span>
  );
}
