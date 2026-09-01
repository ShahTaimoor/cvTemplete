import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import TemplateGallery from './TemplateGallery';
import { overlayFade, modalCard } from '../../lib/motion';

export default function TemplatePickerModal({
  templates,
  loading = false,
  selectedSlug,
  onSelect,
  onClose,
  onCreate,
  isFirstResume,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
      initial={overlayFade.initial}
      animate={overlayFade.animate}
      exit={overlayFade.exit}
      transition={overlayFade.transition}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] shadow-xl border border-slate-200 flex flex-col"
        initial={modalCard.initial}
        animate={modalCard.animate}
        exit={modalCard.exit}
        transition={modalCard.transition}
      >
        <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Sparkles size={20} />
            </span>
            <div className="min-w-0">
              <h2 id="template-picker-title" className="font-semibold text-slate-900">
                Choose a template
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {isFirstResume
                  ? 'Your first resume includes sample content for a quick professional preview.'
                  : 'Filter by layout or search by industry.'}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <TemplateGallery templates={templates} loading={loading} selectedSlug={selectedSlug} onSelect={onSelect} />
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 shrink-0 bg-slate-50/60 rounded-b-xl">
          <button type="button" onClick={onClose} className="app-btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onCreate} className="app-btn-primary">
            Create with selected template
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
