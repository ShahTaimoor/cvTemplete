import { getResumeStyle } from '../../config/templates';

export default function CoverLetterPreview({ letter }) {
  if (!letter) return null;
  const style = getResumeStyle(
    { theme: letter.theme },
    letter.templateSlug || 'classic-blue'
  );
  const p = letter.personal || {};

  return (
    <div
      className="mx-auto max-w-[210mm] shadow-xl text-left p-10 min-h-[297mm] text-[11px] leading-relaxed"
      style={{ background: style.bg, fontFamily: style.font, color: '#1f2937' }}
      data-print-root
    >
      <div data-print-ready="true">
        <p className="font-bold text-base" style={{ color: style.primary }}>{p.fullName}</p>
        <p className="text-gray-500 text-[10px] mt-1">
          {[p.email, p.phone, p.location].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-6 text-gray-600">{letter.date}</p>
        <div className="mt-6 text-gray-800">
          <p>{letter.recipientName}</p>
          <p>{letter.recipientTitle}</p>
          <p className="font-medium">{letter.companyName}</p>
          <p>{letter.companyAddress}</p>
        </div>
        <p className="mt-6">{letter.salutation}</p>
        <div className="mt-4 whitespace-pre-wrap text-gray-700">{letter.body}</div>
        <p className="mt-8">{letter.closing}</p>
        <p className="mt-2 font-semibold">{p.fullName}</p>
      </div>
    </div>
  );
}
