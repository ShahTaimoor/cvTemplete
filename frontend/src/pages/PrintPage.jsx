import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ResumePreview from '../components/resume/ResumePreview';

const API_URL = import.meta.env.VITE_API_URL || '/api';

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

  return (
    <div className="bg-white min-h-screen print:bg-white" data-print-root>
      <div data-print-ready={ready ? 'true' : 'false'}>
        <ResumePreview resume={resume} templateSlug={resume.templateSlug} />
      </div>
    </div>
  );
}
