import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getResumeStyle, getPreviewVariant } from '../config/templates';
import { renderLayout } from '../components/resume/ResumeLayouts';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Standalone print target for server-side PDF generation (see
 * backend POST /api/resumes/:id/pdf, which drives Puppeteer to this route).
 * Deliberately does NOT use <ResumePreview> — that component builds the
 * on-screen, Google-Docs-style paginated preview (absolutely-positioned
 * page blocks, shadows, scale-to-fit transforms), which is exactly wrong
 * for native PDF printing. This renders the same renderLayout() output
 * (the single source of truth for all 63 layouts) in plain, natural
 * document flow, and lets @page + the browser's own pagination split it
 * across pages.
 */
export default function PrintPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [resume, setResume] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    axios
      .get(`${API_URL}/print/resume/${id}`, { params: { token } })
      .then((res) => {
        setResume(res.data);
        // Give web fonts (Google Fonts loaded via index.html) time to apply
        // before Puppeteer captures the page.
        setTimeout(() => setReady(true), 800);
      })
      .catch(() => setReady(true));
  }, [id, token]);

  if (!resume) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">
        Preparing print view...
      </div>
    );
  }

  const style = getResumeStyle(resume, resume.templateSlug);
  const variant = getPreviewVariant(style);

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1, h2, h3, li, img { break-inside: avoid; }
      `}</style>
      <div
        className="resume-preview-root w-[210mm]"
        style={{ fontFamily: style.font, color: '#1f2937', background: style.bg }}
        data-print-ready={ready ? 'true' : 'false'}
      >
        {renderLayout(style.layout, { resume, style, variant })}
      </div>
    </>
  );
}
