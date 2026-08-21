import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTemplatePreset } from '../../config/templates';
import TemplateThumbnail from './TemplateThumbnail';
import Skeleton from '../common/Skeleton';

// Mirrors TemplateCard's shape: colored header block containing the
// thumbnail-shaped area, then a category-tag line and a title line.
export function TemplateCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border-2 border-slate-200 bg-white">
      <div className="p-3 pb-3 bg-brand-50">
        <div className="bg-white/70 rounded-lg p-2">
          <Skeleton shape="rounded" className="w-full aspect-[210/297]" />
        </div>
        <Skeleton shape="rounded" width="50%" height={8} className="mt-3 mb-1.5" />
        <Skeleton shape="rounded" width="75%" height={12} />
      </div>
    </div>
  );
}

export default function TemplateCard({ template, onSelect, selected }) {
  const preset = getTemplatePreset(template.slug);
  const headerBg = preset.primary || '#2563eb';

  const handleClick = () => {
    if (template.locked || !onSelect) return;
    onSelect(template);
  };

  return (
    <motion.div
      whileHover={{ scale: template.locked ? 1 : 1.02 }}
      role={!template.locked && onSelect ? 'button' : undefined}
      tabIndex={!template.locked && onSelect ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !template.locked) {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`relative rounded-xl overflow-hidden border-2 transition bg-white text-left w-full ${
        template.locked ? 'cursor-default' : onSelect ? 'cursor-pointer' : ''
      } ${
        selected
          ? 'border-brand-500 ring-2 ring-brand-500/25'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {!template.locked && onSelect && (
        <div
          className={`absolute top-2 right-2 z-20 w-6 h-6 rounded-md flex items-center justify-center border-2 transition ${
            selected
              ? 'bg-brand-600 border-brand-500 text-white'
              : 'bg-white border-slate-300 text-transparent'
          }`}
          aria-hidden
        >
          <Check size={14} strokeWidth={3} className={selected ? 'opacity-100' : 'opacity-0'} />
        </div>
      )}

      <div className="p-3 pb-3" style={{ backgroundColor: headerBg }}>
        <div className="bg-white/95 rounded-lg p-2 shadow-lg pointer-events-none">
          <TemplateThumbnail slug={template.slug} />
        </div>
        <div className="mt-2 pointer-events-none">
          <span className="text-white/80 text-[10px] uppercase tracking-wider">
            {template.flag ? `${template.flag} ${template.countryLabel || 'Regional'}` : template.category}
          </span>
          <h3 className="text-white font-semibold text-sm leading-tight">
            {template.name}
          </h3>
        </div>
      </div>

      {template.locked && (
        <div
          className="absolute inset-0 backdrop-blur-sm bg-slate-900/70 flex flex-col items-center justify-center gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <Lock className="text-brass" size={28} />
          <p className="text-xs text-slate-300 text-center px-2">
            {template.lockReason || 'Upgrade to unlock'}
          </p>
          <Link
            to="/pricing"
            className="text-xs bg-brass hover:bg-brass/90 text-brand-700 font-semibold px-3 py-1.5 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            Upgrade to Unlock
          </Link>
        </div>
      )}
    </motion.div>
  );
}
