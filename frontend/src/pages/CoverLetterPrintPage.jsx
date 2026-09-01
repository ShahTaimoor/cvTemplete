import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getResumeStyle } from '../config/templates';
import { CoverLetterContent } from '../components/coverLetter/CoverLetterPreview';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Standalone print target for server-side PDF generation (see backend
 * POST /api/cover-letters/:id/pdf, which drives Puppeteer to this route) —
 * the cover-letter counterpart to PrintPage.jsx. Deliberately does NOT use
 * <CoverLetterPreview> — that component simulates an on-screen A4 page
 * (fixed min-height, shadow, mx-auto centering), which is exactly wrong
 * for native PDF printing. This renders the same <CoverLetterContent>
 * (the single source of truth for the letter's actual content) in plain,
 * natural document flow, and lets @page + the browser's own pagination
 * handle it — including splitting across pages for a longer letter,
 * rather than the on-screen preview's fixed one-page box.
 */
export default function CoverLetterPrintPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [letter, setLetter] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    axios
      .get(`${API_URL}/print/cover-letter/${id}`, { params: { token } })
      .then((res) => {
        setLetter(res.data);
        // Give web fonts (Google Fonts loaded via index.html) time to apply
        // before Puppeteer captures the page.
        setTimeout(() => setReady(true), 800);
      })
      .catch(() => setReady(true));
  }, [id, token]);

  if (!letter) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">
        Preparing print view...
      </div>
    );
  }

  const style = getResumeStyle({ theme: letter.theme }, letter.templateSlug || 'classic-blue');

  return (
    <>
      <style>{`
        @page { size: A4; margin: 0; }
        html, body { margin: 0; padding: 0; background: ${style.bg}; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h1, h2, h3, p { break-inside: avoid; }
      `}</style>
      <div
        id="print-page-root"
        className="p-10 text-[11px] leading-relaxed"
        style={{ width: '210mm', fontFamily: style.font, color: '#1f2937', background: style.bg }}
        data-print-ready={ready ? 'true' : 'false'}
      >
        <CoverLetterContent letter={letter} style={style} />
      </div>
    </>
  );
}
