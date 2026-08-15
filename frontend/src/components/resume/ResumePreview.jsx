import { useLayoutEffect, useRef, useState } from 'react';
import { getResumeStyle, getPreviewVariant } from '../../config/templates';
import { renderLayout } from './ResumeLayouts';

// Keep in sync with A4_WIDTH_MM / A4_HEIGHT_MM in ../../utils/exportPreview.js
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
// CSS spec: 1in = 96px = 25.4mm
const MM_TO_PX = 96 / 25.4;
const PAGE_HEIGHT_TOLERANCE_MM = 3;
const PAGE_GAP_PX = 32; // matches gap-8 below

export default function ResumePreview({ resume, templateSlug }) {
  const slug = templateSlug || resume?.templateSlug || 'classic-blue';
  const style = resume ? getResumeStyle(resume, slug) : null;
  const variant = getPreviewVariant(style);

  const content = resume ? renderLayout(style.layout, { resume, style, variant }) : null;

  const measureRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return undefined;

    const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX;
    const tolerancePx = PAGE_HEIGHT_TOLERANCE_MM * MM_TO_PX;

    const measure = () => {
      const contentHeightPx = el.scrollHeight;
      const nextCount =
        contentHeightPx <= pageHeightPx + tolerancePx
          ? 1
          : Math.ceil(contentHeightPx / pageHeightPx);
      setPageCount((prev) => (prev === nextCount ? prev : nextCount));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [resume, slug]);

  // Scale the fixed-size pages down to fit narrower containers (e.g. the builder's
  // split-pane preview column), while the underlying page markup stays true A4 size.
  const scaleWrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = scaleWrapperRef.current;
    if (!el) return undefined;

    const pageWidthPx = A4_WIDTH_MM * MM_TO_PX;

    const measure = () => {
      const availableWidth = el.clientWidth;
      const nextScale = availableWidth > 0 ? Math.min(1, availableWidth / pageWidthPx) : 1;
      setScale((prev) => (Math.abs(prev - nextScale) < 0.001 ? prev : nextScale));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX;
  const totalHeightPx = pageCount * pageHeightPx + (pageCount - 1) * PAGE_GAP_PX;

  if (!resume) return null;

  return (
    <div className="resume-preview-pages w-full">
      {/*
        Full-flow copy — export/print pipelines (html-to-image via exportPreview.js)
        target this via [data-print-root]. It must stay in normal, un-hacked layout:
        html-to-image clones this node and copies its *computed* style verbatim onto
        the clone (see clone-node.js's cloneCSSStyle). Hiding it with an extreme
        absolute offset, visibility:hidden, or opacity:0 bakes that same property
        into the clone, so the captured image renders blank/off-canvas. Instead we
        collapse a normal-flow ANCESTOR to zero height with overflow:hidden — that
        keeps this element's own computed style completely normal (position:static,
        visible, opaque, real dimensions) while giving it no visual footprint.
      */}
      <div style={{ height: 0, overflow: 'hidden' }} aria-hidden="true">
        <div
          className="resume-preview-root shadow-2xl w-[210mm] text-left rounded-sm overflow-hidden"
          style={{ fontFamily: style.font, color: '#1f2937', background: style.bg }}
          data-print-root
          data-resume-bg={style.bg}
        >
          <div data-print-ready="true">{content}</div>
        </div>
      </div>

      {/* Copy fixed at true page width, used only to measure total content height. */}
      <div style={{ height: 0, overflow: 'hidden' }} aria-hidden="true">
        <div ref={measureRef} className="w-[210mm]">
          {content}
        </div>
      </div>

      {/* On-screen paginated preview: distinct A4 page blocks, Google Docs style. */}
      <div ref={scaleWrapperRef} className="w-full overflow-hidden flex justify-center">
        <div
          style={{
            width: `${A4_WIDTH_MM}mm`,
            flexShrink: 0,
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top center',
            height: scale < 1 ? `${totalHeightPx * scale}px` : undefined,
          }}
        >
          <div className="flex flex-col items-center gap-8">
            {Array.from({ length: pageCount }).map((_, i) => (
              <div
                key={i}
                className="relative bg-white shadow-2xl rounded-sm overflow-hidden w-[210mm] h-[297mm] shrink-0"
                style={{ fontFamily: style.font, color: '#1f2937', background: style.bg }}
              >
                <div style={{ position: 'absolute', top: `-${i * A4_HEIGHT_MM}mm`, left: 0, width: '100%' }}>
                  {content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
