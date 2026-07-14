import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicAPI } from '../services/api';
import ResumePreview from '../components/resume/ResumePreview';

export default function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
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
