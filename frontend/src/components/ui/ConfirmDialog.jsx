import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { overlayFade, modalCard } from '../../lib/motion';

/**
 * Presentational confirm/prompt dialog. Rendered by ConfirmDialogProvider —
 * use the useConfirm() hook to trigger it rather than mounting this directly.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  inputMode,
  inputLabel,
  defaultValue,
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState(defaultValue || '');
  const inputRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (inputMode) inputRef.current?.focus();
    else confirmBtnRef.current?.focus();
  }, [inputMode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(inputMode ? value : undefined);
  };

  const Icon = destructive ? AlertTriangle : HelpCircle;

  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-slate-900/60 flex items-center justify-center p-4"
      initial={overlayFade.initial}
      animate={overlayFade.animate}
      exit={overlayFade.exit}
      transition={overlayFade.transition}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200"
        initial={modalCard.initial}
        animate={modalCard.animate}
        exit={modalCard.exit}
        transition={modalCard.transition}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-start gap-3 mb-2">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                destructive ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
              }`}
            >
              <Icon size={18} />
            </span>
            <div className="min-w-0 pt-1">
              <h3 id="confirm-dialog-title" className="font-semibold text-slate-900">
                {title}
              </h3>
              {message && <p className="text-sm text-slate-600 mt-1">{message}</p>}
            </div>
          </div>

          {inputMode && (
            <div className="mt-4">
              {inputLabel && <label className="app-label">{inputLabel}</label>}
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="app-input"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-5">
            <button type="button" onClick={onCancel} className="app-btn-secondary">
              {cancelLabel}
            </button>
            <button
              ref={confirmBtnRef}
              type="submit"
              className={
                destructive
                  ? 'inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors'
                  : 'app-btn-primary'
              }
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
