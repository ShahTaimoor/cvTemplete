import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Globe, ChevronDown } from 'lucide-react';
import {
  TEMPLATE_FILTERS,
  COUNTRY_FILTERS,
  REGION_FILTERS,
  PLAN_FILTERS,
  filterTemplates,
} from '../../config/templateFilters';
import { withTemplateSlug } from '../../data/sampleResume';
import TemplateCard, { TemplateCardSkeleton } from '../templates/TemplateCard';
import ResumePreview from '../resume/ResumePreview';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { getPageNumbers } from '../../utils/pagination';

const SKELETON_CARD_COUNT = 8;

const PAGE_SIZE = 24;

export default function TemplateGallery({
  templates,
  selectedSlug,
  onSelect,
  compact = false,
  totalCount,
  loading = false,
}) {
  const [filter, setFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [previewSlug, setPreviewSlug] = useState(null);
  const [showCountries, setShowCountries] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const dropdownRef = useRef(null);
  const [page, setPage] = useState(1);
  const gridTopRef = useRef(null);

  const filtered = useMemo(
    () => filterTemplates(templates, filter, search, countryFilter, regionFilter, planFilter),
    [templates, filter, search, countryFilter, regionFilter, planFilter]
  );

  useEffect(() => {
    if (!showCountries) return undefined;

    // Freeze every scrollable ancestor (the modal body, the page) while the
    // dropdown is open; the dropdown's own list keeps scrolling normally.
    const locked = [document.body];
    for (let el = dropdownRef.current?.parentElement; el; el = el.parentElement) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === 'auto' || overflowY === 'scroll') locked.push(el);
    }
    const previous = locked.map((el) => el.style.overflow);
    locked.forEach((el) => { el.style.overflow = 'hidden'; });

    const onKey = (e) => e.key === 'Escape' && setShowCountries(false);
    document.addEventListener('keydown', onKey);
    return () => {
      locked.forEach((el, i) => { el.style.overflow = previous[i]; });
      document.removeEventListener('keydown', onKey);
    };
  }, [showCountries]);

  const visibleCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return q ? COUNTRY_FILTERS.filter((f) => f.label.toLowerCase().includes(q)) : COUNTRY_FILTERS;
  }, [countrySearch]);

  useEffect(() => {
    setPage(1);
  }, [filter, search, countryFilter, regionFilter, planFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    gridTopRef.current?.scrollIntoView({ block: 'nearest' });
  }, [currentPage]);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const previewTemplate = templates.find((t) => t.slug === previewSlug);
  const allCount = totalCount ?? templates.length;

  const activeLabel = [
    filter !== 'all' ? TEMPLATE_FILTERS.find((f) => f.id === filter)?.label : null,
    countryFilter !== 'all' ? COUNTRY_FILTERS.find((f) => f.id === countryFilter)?.label : null,
    regionFilter !== 'all' ? REGION_FILTERS.find((f) => f.id === regionFilter)?.label : null,
    planFilter !== 'all' ? PLAN_FILTERS.find((f) => f.id === planFilter)?.label : null,
  ].filter(Boolean).join(' · ');

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="search"
            placeholder="Search country, style, layout..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="app-input !py-2 pl-9 text-sm"
          />
        </div>
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowCountries((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={showCountries}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border w-full sm:w-auto ${
              showCountries || countryFilter !== 'all'
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            <Globe size={14} />
            {countryFilter !== 'all'
              ? COUNTRY_FILTERS.find((f) => f.id === countryFilter)?.label
              : 'Filter by country'}
            <ChevronDown size={14} className={`transition ${showCountries ? 'rotate-180' : ''}`} />
          </button>

          {showCountries && (
            <div className="absolute right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="p-2 border-b border-slate-100 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search country..."
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="app-input !py-1.5 pl-8 text-sm w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => { setShowCountries(false); setCountrySearch(''); }}
                  aria-label="Close country filter"
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <X size={16} />
                </button>
              </div>
              <div role="listbox" className="max-h-64 overflow-y-auto p-1">
                {visibleCountries.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-slate-500 text-center">No countries found</p>
                ) : (
                  visibleCountries.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      role="option"
                      aria-selected={countryFilter === f.id}
                      onClick={() => {
                        setCountryFilter(f.id);
                        if (f.id !== 'all') setFilter('regional');
                        setShowCountries(false);
                        setCountrySearch('');
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm ${
                        countryFilter === f.id
                          ? 'bg-brand-600 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-2">Region</p>
        <div className="flex flex-wrap gap-1.5">
          {REGION_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setRegionFilter(f.id);
                if (f.id !== 'all') setFilter('regional');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                regionFilter === f.id
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {TEMPLATE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              filter === f.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {PLAN_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setPlanFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              planFilter === f.id
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
          {Array.from({ length: SKELETON_CARD_COUNT }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <p ref={gridTopRef} className="text-xs text-slate-500 mb-3">
            Showing {rangeStart}–{rangeEnd} of {filtered.length} templates
            {filtered.length !== allCount ? ` (${allCount} total)` : ''}
            {activeLabel ? ` · ${activeLabel}` : ''}
            {!compact && ' — click Preview for sample data'}
          </p>

          {filtered.length === 0 && (
            <p className="text-sm text-slate-500 py-8 text-center">
              No templates match. Try{' '}
              <button
                type="button"
                className="text-brand-600 font-medium"
                onClick={() => {
                  setFilter('all');
                  setCountryFilter('all');
                  setRegionFilter('all');
                  setPlanFilter('all');
                  setSearch('');
                }}
              >
                reset filters
              </button>
            </p>
          )}

          <motion.div
            key={currentPage}
            className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.02)}
          >
            {pageItems.map((t) => (
              <motion.div key={t.slug || t._id} variants={staggerItem} className="space-y-2">
                <TemplateCard template={t} selected={selectedSlug === t.slug} onSelect={onSelect} />
                {!compact && (
                  <button
                    type="button"
                    onClick={() => setPreviewSlug(t.slug)}
                    className="w-full text-xs py-1 text-slate-500 hover:text-brand-600 font-medium"
                  >
                    Preview with sample data
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-1.5 mt-6">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-slate-600 border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              {getPageNumbers(currentPage, totalPages).map((n, i) =>
                n === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400">
                    …
                  </span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[32px] px-2 py-1.5 rounded-lg text-xs font-medium border ${
                      n === currentPage
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white text-slate-600 border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {previewSlug && previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">{previewTemplate.name} — Sample Preview</h3>
              <button type="button" onClick={() => setPreviewSlug(null)} className="text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <div className="bg-slate-100 p-4 rounded-lg overflow-x-auto">
              <ResumePreview resume={withTemplateSlug(previewSlug)} templateSlug={previewSlug} />
            </div>
            {!previewTemplate.locked && (
              <button
                type="button"
                onClick={() => {
                  onSelect(previewTemplate);
                  setPreviewSlug(null);
                }}
                className="mt-4 w-full app-btn-primary"
              >
                Use this template
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
