import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, X, Loader2, FileImage, Copy, Check, Landmark, Smartphone, Wallet } from 'lucide-react';
import { overlayFade, modalCard } from '../../lib/motion';
import { subscriptionAPI } from '../../services/api';
import { paymentMethodTitle } from '../../utils/paymentMethods';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const TYPE_ICON = { easypaisa: Smartphone, jazzcash: Smartphone, bank: Landmark, other: Wallet };

/**
 * Collects the payment screenshot (required) plus an optional transaction
 * reference, then hands them to `onSubmit({ file, reference })`. The parent
 * (PricingPage) does the actual upload + request calls and drives
 * `submitting`.
 */
export default function PlanRequestModal({
  planName,
  amountLabel,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const [methods, setMethods] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // The accounts the admin set up under Payment Settings.
  useEffect(() => {
    let cancelled = false;
    subscriptionAPI
      .paymentMethods()
      .then(({ data }) => {
        if (!cancelled) setMethods(data?.methods || []);
      })
      .catch(() => {
        /* the text below still tells the user what to do */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const copyNumber = async (method) => {
    try {
      await navigator.clipboard.writeText(method.accountNumber);
      setCopiedId(method._id);
      setTimeout(() => setCopiedId((id) => (id === method._id ? null : id)), 1500);
    } catch {
      /* clipboard blocked — the number is still visible to copy by hand */
    }
  };

  // Body does no setState (lint-safe); it just revokes the object URL created
  // in pickFile() when it's replaced or the modal unmounts.
  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const pickFile = (selected) => {
    if (!selected) return;
    if (!ACCEPTED.includes(selected.type)) {
      setError('Please choose a JPG, PNG, GIF, or WEBP image.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError('That image is over 5 MB. Please choose a smaller file.');
      return;
    }
    setError('');
    setFile(selected);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(selected);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setError('A payment screenshot is required.');
      return;
    }
    onSubmit({ file, reference: reference.trim() });
  };

  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4"
      initial={overlayFade.initial}
      animate={overlayFade.animate}
      exit={overlayFade.exit}
      transition={overlayFade.transition}
      onClick={() => !submitting && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-request-title"
        className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl border border-slate-200"
        initial={modalCard.initial}
        animate={modalCard.animate}
        exit={modalCard.exit}
        transition={modalCard.transition}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 id="plan-request-title" className="font-semibold text-slate-900">
            Request the {planName} plan
          </h3>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            className="text-slate-400 hover:text-slate-600 -mt-1 -mr-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Transfer {amountLabel ? <strong>{amountLabel}</strong> : 'the payment'}{' '}
          {methods.length ? 'to one of the accounts below' : 'to the account shared with you'}, then upload the
          transfer screenshot. An admin verifies it and your plan starts once approved.
        </p>

        {methods.length > 0 && (
          <ul className="space-y-2 mb-4">
            {methods.map((m) => {
              const Icon = TYPE_ICON[m.type] || Wallet;
              return (
                <li key={m._id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="h-9 w-9 shrink-0 rounded-lg bg-white border border-slate-200 text-brand-600 flex items-center justify-center">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{paymentMethodTitle(m)}</p>
                    <p className="text-xs text-slate-600">{m.accountName}</p>
                    <p className="text-sm font-mono text-slate-900 break-all">{m.accountNumber}</p>
                    {m.note && <p className="text-xs text-slate-500 mt-0.5">{m.note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyNumber(m)}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
                  >
                    {copiedId === m._id ? <Check size={13} /> : <Copy size={13} />}
                    {copiedId === m._id ? 'Copied' : 'Copy'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <form onSubmit={handleSubmit}>
          <label className="app-label">Payment screenshot</label>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {previewUrl ? (
            <div className="relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
              <img src={previewUrl} alt="Payment screenshot preview" className="max-h-56 w-full object-contain" />
              <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-slate-200 bg-white">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                  <FileImage size={14} className="shrink-0" />
                  <span className="truncate">{file?.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="text-xs font-semibold text-brand-600 hover:underline shrink-0"
                  disabled={submitting}
                >
                  Replace
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-brand-400 hover:bg-brand-50/40 transition-colors px-4 py-8 flex flex-col items-center gap-2 text-slate-500"
            >
              <UploadCloud size={22} />
              <span className="text-sm font-medium">Click to upload a screenshot</span>
              <span className="text-xs text-slate-400">JPG, PNG, GIF or WEBP — max 5 MB</span>
            </button>
          )}

          <div className="mt-4">
            <label className="app-label" htmlFor="plan-request-reference">
              Transaction ID / reference <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="plan-request-reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="app-input"
              placeholder="e.g. JazzCash TID or bank ref no."
              maxLength={200}
            />
          </div>

          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={onClose} className="app-btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="app-btn-primary gap-2" disabled={submitting || !file}>
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
