import { getResumeStyle } from '../../config/templates';
import { renderLayout } from './ResumeLayouts';

export default function ResumePreview({ resume, templateSlug }) {
  if (!resume) return null;

  const slug = templateSlug || resume?.templateSlug || 'classic-blue';
  const style = getResumeStyle(resume, slug);
  const variant =
    ['minimal', 'tech'].includes(style.layout)
      ? 'minimal'
      : style.layout === 'elegant'
        ? 'elegant'
        : 'default';

  return (
    <div
      className="resume-preview-root shadow-2xl mx-auto w-full max-w-[210mm] text-left rounded-sm overflow-hidden"
      style={{ fontFamily: style.font, color: '#1f2937', background: style.bg }}
      data-print-root
      data-resume-bg={style.bg}
    >
      <div data-print-ready="true">
        {renderLayout(style.layout, { resume, style, variant })}
      </div>
    </div>
  );
}
