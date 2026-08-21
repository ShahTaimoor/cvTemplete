import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import ResumePreview from '../components/resume/ResumePreview';

export default function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // The backend logs a view as a side effect of this same fetch (see
  // GET /api/public/share/:token), so an unguarded effect double-fires the
  // request under React 18 StrictMode's dev-only mount→cleanup→mount and
  // double-counts every visit. Same guard pattern as DashboardPage's
  // fetchedForPlanRef: checked before the fetch fires, set to the current
  // key immediately, so the synthetic re-run sees it already matches and
  // bails out. A genuine token change (a different share link) still
  // fetches normally, since the ref won't match the new token.
  const fetchedForTokenRef = useRef(null);
  useEffect(() => {
    if (fetchedForTokenRef.current === token) return;
    fetchedForTokenRef.current = token;
    publicAPI
      .share(token)
      .then((res) => setData(res.data))
      .catch(() => setError('Resume not found or link expired'));
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
      <p className="text-center text-sm text-slate-500 mb-4">Shared Resume</p>
      <ResumePreview resume={data.resume} templateSlug={data.resume.templateSlug} />
    </div>
  );
}
