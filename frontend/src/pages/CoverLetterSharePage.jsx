import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import CoverLetterPreview from '../components/coverLetter/CoverLetterPreview';

export default function CoverLetterSharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Mirrors SharePage.jsx's fetchedForTokenRef guard exactly — without it,
  // React 18 StrictMode's dev-only mount→cleanup→mount double-fires the
  // fetch. No view-logging happens on this route (see publicRoutes.js), so
  // this guard is purely about avoiding a redundant request, not double-
  // counting analytics like SharePage's version — kept anyway to match the
  // established pattern and avoid the wasted duplicate fetch.
  const fetchedForTokenRef = useRef(null);
  useEffect(() => {
    if (fetchedForTokenRef.current === token) return;
    fetchedForTokenRef.current = token;
    publicAPI
      .shareCoverLetter(token)
      .then((res) => setData(res.data))
      .catch(() => setError('Cover letter not found or link expired'));
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-slate-900">
      <p className="text-center text-sm text-slate-500 mb-4">Shared Cover Letter</p>
      <CoverLetterPreview letter={data.letter} />
    </div>
  );
}
