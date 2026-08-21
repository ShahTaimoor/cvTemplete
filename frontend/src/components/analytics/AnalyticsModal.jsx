import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Eye, Download, Lock, X } from 'lucide-react';
import { resumeAPI, coverLetterAPI } from '../../services/api';
import { overlayFade, modalCard, staggerContainer, staggerItem } from '../../lib/motion';

const formatTick = (dateStr) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

const formatTooltipLabel = (dateStr) =>
  new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });

function LockedState({ isCoverLetter }) {
  const planLabel = isCoverLetter ? 'Premium plan' : 'Pro plan or higher';
  const contentLabel = isCoverLetter ? 'cover letter' : 'resume';
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/90 mb-4">
        <Lock className="text-amber-400" size={26} />
      </span>
      <h3 className="font-semibold text-slate-900 capitalize">{contentLabel} analytics requires {planLabel}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-sm">
        See how many people view your shared {contentLabel} and how often it's downloaded, with a 30-day trend.
      </p>
      <Link
        to="/pricing"
        className="mt-5 text-sm bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-4 py-2 rounded-lg"
      >
        Upgrade to Unlock
      </Link>
    </div>
  );
}

// `coverLetterId` is the Cover Letter equivalent of `resumeId` — pass
// exactly one. Cover Letters are Premium-only end to end (see
// CoverLetterPage.jsx's own page-level gate), a strictly higher bar than
// Resume's Pro-or-higher, so `unlocked` below still holds for both: any
// plan that can even reach this modal for a cover letter is already
// Premium, which satisfies the same ['pro','premium'] check.
export default function AnalyticsModal({ resumeId, coverLetterId, plan, onClose }) {
  const isCoverLetter = Boolean(coverLetterId);
  const itemId = coverLetterId || resumeId;
  const unlocked = ['pro', 'premium'].includes(plan);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    const fetcher = isCoverLetter ? coverLetterAPI.analytics(itemId) : resumeAPI.analytics(itemId);
    fetcher
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load analytics');
      });
    return () => {
      cancelled = true;
    };
  }, [itemId, isCoverLetter, unlocked]);

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
        aria-labelledby="analytics-modal-title"
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] shadow-xl border border-slate-200 flex flex-col"
        initial={modalCard.initial}
        animate={modalCard.animate}
        exit={modalCard.exit}
        transition={modalCard.transition}
      >
        <div className="flex items-start justify-between gap-3 p-6 pb-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 id="analytics-modal-title" className="font-semibold text-slate-900">
              {isCoverLetter ? 'Cover letter analytics' : 'Resume analytics'}
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Views and downloads for this {isCoverLetter ? 'cover letter' : 'resume'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!unlocked && <LockedState isCoverLetter={isCoverLetter} />}

          {unlocked && error && (
            <p className="text-sm text-red-600 text-center py-12">{error}</p>
          )}

          {unlocked && !error && !data && (
            <p className="text-sm text-slate-500 text-center py-12">Loading analytics...</p>
          )}

          {unlocked && !error && data && (
            <>
              <motion.div
                className="grid grid-cols-2 gap-4 mb-6"
                initial="hidden"
                animate="visible"
                variants={staggerContainer()}
              >
                <motion.div variants={staggerItem} className="app-card p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 mb-2">
                    <Eye size={18} />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total views</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{data.totalViews}</p>
                </motion.div>
                <motion.div variants={staggerItem} className="app-card p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 mb-2">
                    <Download size={18} />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total downloads</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{data.totalDownloads}</p>
                </motion.div>
              </motion.div>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Last 30 days
              </p>
              <div className="h-64 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.timeline} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatTick}
                      interval={4}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip labelFormatter={formatTooltipLabel} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="views" name="Views" stroke="#1d4ed8" strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="downloads"
                      name="Downloads"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
