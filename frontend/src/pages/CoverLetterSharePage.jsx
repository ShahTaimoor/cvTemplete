import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import CoverLetterPreview from '../components/coverLetter/CoverLetterPreview';

export default function CoverLetterSharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Mirrors SharePage.jsx's fetchedForTokenRef guard exactly, for exactly
  // the same reason: the backend logs a view as a side effect of this same
  // fetch (see GET /api/public/share/cover-letter/:token), so an unguarded
  // effect double-fires the request under React 18 StrictMode's dev-only
  // mount→cleanup→mount and double-counts every visit. A genuine token
  // change (a different share link) still fetches normally, since the ref
  // won't match the new token.
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
