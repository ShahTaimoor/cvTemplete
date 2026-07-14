import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Download, Save } from 'lucide-react';
import { coverLetterAPI, downloadBlob } from '../services/api';
import CoverLetterPreview from '../components/coverLetter/CoverLetterPreview';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function CoverLetterPage() {
  const { id } = useParams();
  const { user } = useSelector((s) => s.auth);
  const plan = user?.subscription?.plan || 'free';
  const [letter, setLetter] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan !== 'premium') return;
    coverLetterAPI.get(id).then((r) => setLetter(r.data));
  }, [id, plan]);

  const update = (key, value) => setLetter((prev) => ({ ...prev, [key]: value }));

  const updatePersonal = (key, value) =>
    setLetter((prev) => ({
      ...prev,
      personal: { ...prev.personal, [key]: value },
    }));

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await coverLetterAPI.update(id, letter);
      setLetter(data);
    } finally {
      setSaving(false);
    }
  };

  const exportDocx = async () => {
    const { data } = await coverLetterAPI.docx(id);
    downloadBlob(data, `${letter.title || 'cover-letter'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };

  if (plan !== 'premium') {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-16 text-center px-4">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Cover letters — Premium</h1>
          <p className="text-slate-600 mb-4">Upgrade to Premium to create matching cover letters.</p>
          <Link to="/pricing" className="text-brand-600 font-semibold hover:underline">
            View plans
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!letter) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-slate-500">Loading cover letter...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullHeight>
      <div className="h-full flex flex-col lg:flex-row">
        <div className="lg:w-1/2 p-4 overflow-y-auto border-r border-slate-200 bg-white space-y-4">
          <div className="flex justify-between items-center">
            <input
              value={letter.title}
              onChange={(e) => update('title', e.target.value)}
              className="font-semibold text-slate-900 bg-transparent border-b border-slate-300 flex-1 mr-2 pb-1"
            />
            <button type="button" onClick={save} disabled={saving} className="app-btn-primary !py-1.5 gap-1 text-sm">
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>

          {['fullName', 'email', 'phone', 'location'].map((f) => (
            <div key={f}>
              <label className="app-label capitalize">{f}</label>
              <input
                value={letter.personal?.[f] || ''}
                onChange={(e) => updatePersonal(f, e.target.value)}
                className="app-input text-sm"
              />
            </div>
          ))}

          {['recipientName', 'recipientTitle', 'companyName', 'companyAddress', 'date', 'salutation', 'closing'].map((f) => (
            <div key={f}>
              <label className="app-label">{f}</label>
              <input
                value={letter[f] || ''}
                onChange={(e) => update(f, e.target.value)}
                className="app-input text-sm"
              />
            </div>
          ))}

          <div>
            <label className="app-label">Letter body</label>
            <textarea
              value={letter.body || ''}
              onChange={(e) => update('body', e.target.value)}
              rows={12}
              className="app-input text-sm"
            />
          </div>

          <button type="button" onClick={exportDocx} className="app-btn-secondary gap-2 text-sm">
            <Download size={16} /> Export DOCX
          </button>
        </div>

        <div className="lg:w-1/2 p-4 overflow-y-auto bg-slate-100">
          <p className="text-xs text-center text-slate-600 mb-2 font-medium">Preview</p>
          <CoverLetterPreview letter={letter} />
        </div>
      </div>
    </DashboardLayout>
  );
}
