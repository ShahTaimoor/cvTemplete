import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertCircle, CheckCircle, Download, Trash2 } from 'lucide-react';
import { coverLetterAPI, downloadBlob } from '../services/api';
import CoverLetterPreview from '../components/coverLetter/CoverLetterPreview';
import DashboardLayout from '../components/layout/DashboardLayout';
import MotionIcon from '../components/common/MotionIcon';
import Skeleton from '../components/common/Skeleton';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { buildCoverLetterSavePayload, useCoverLetterAutoSave } from '../hooks/useCoverLetterAutoSave';

// Human-readable labels for the flat field keys below — an explicit map
// (not a generic camelCase-splitter) since it's a small fixed set of fields
// and this guarantees exactly the right wording for every one of them.
const PERSONAL_LABELS = {
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
};

const LETTER_LABELS = {
  recipientName: 'Recipient Name',
  recipientTitle: 'Recipient Title',
  companyName: 'Company Name',
  companyAddress: 'Company Address',
  date: 'Date',
  salutation: 'Salutation',
  closing: 'Closing',
};

// Shape-matched placeholder for the initial fetch below (`if (!letter)`) —
// mirrors the real two-column layout (title + status/actions row, the
// personal + letter field pairs, the body textarea, the export button, and
// the preview panel) instead of the previous plain "Loading cover
// letter..." text. Same pattern as BuilderSkeleton in BuilderPage.jsx.
function CoverLetterSkeleton() {
  return (
    <div className="h-full flex flex-col lg:flex-row">
      <div className="lg:w-1/2 p-4 border-r border-slate-200 bg-white space-y-4">
        <div className="flex justify-between items-center gap-2">
          <Skeleton shape="rounded" className="flex-1" height={28} />
          <Skeleton shape="rounded" width={34} height={30} />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`personal-${i}`} className="space-y-1.5">
            <Skeleton shape="rounded" width="30%" height={12} />
            <Skeleton shape="rounded" className="w-full" height={38} />
          </div>
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`letter-${i}`} className="space-y-1.5">
            <Skeleton shape="rounded" width="35%" height={12} />
            <Skeleton shape="rounded" className="w-full" height={38} />
          </div>
        ))}
        <div className="space-y-1.5">
          <Skeleton shape="rounded" width="25%" height={12} />
          <Skeleton shape="rounded" className="w-full" height={140} />
        </div>
        <Skeleton shape="rounded" width={140} height={38} />
      </div>
      <div className="lg:w-1/2 p-4 bg-slate-100 flex items-center justify-center">
        <Skeleton shape="rounded" className="w-full max-w-md aspect-[210/297]" />
      </div>
    </div>
  );
}

export default function CoverLetterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { user } = useSelector((s) => s.auth);
  const plan = user?.subscription?.plan || 'free';
  const [letter, setLetter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

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

  // Matches useAutoSave's error handling exactly (frontend/src/hooks/useAutoSave.js):
  // surface the failure via toast.error, and keep a visible failed-state
  // indicator in the header rather than letting the button silently revert
  // as if nothing went wrong. Called both by the debounced autosave below
  // and (indirectly, via the same status indicator) at natural moments —
  // matching Resume Builder, which has no manual "Save" button at all and
  // relies entirely on useAutoSave.
  const save = async () => {
    setSaving(true);
    try {
      const { data } = await coverLetterAPI.update(id, buildCoverLetterSavePayload(letter));
      setLetter(data);
      setLastSaved(new Date().toISOString());
      setSaveError(false);
    } catch (err) {
      setSaveError(true);
      toast.error(err.response?.data?.message || 'Failed to save changes — please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  useCoverLetterAutoSave(letter, save);

  const exportDocx = async () => {
    const { data } = await coverLetterAPI.docx(id);
    downloadBlob(data, `${letter.title || 'cover-letter'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };

  const deleteLetter = async () => {
    const ok = await confirmDialog({
      title: 'Delete this cover letter?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await coverLetterAPI.remove(id);
    toast.success('Cover letter deleted');
    navigate('/dashboard');
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
      <DashboardLayout fullHeight>
        <CoverLetterSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullHeight>
      <div className="h-full flex flex-col lg:flex-row">
        <div className="lg:w-1/2 p-4 overflow-y-auto border-r border-slate-200 bg-white space-y-4">
          <div className="flex justify-between items-center gap-2">
            <input
              value={letter.title}
              onChange={(e) => update('title', e.target.value)}
              className="font-semibold text-slate-900 bg-transparent border-b border-slate-300 flex-1 pb-1"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs hidden sm:flex items-center gap-1">
                {saving ? (
                  <span className="text-slate-500">Saving...</span>
                ) : saveError ? (
                  <span className="text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    Save failed
                  </span>
                ) : (
                  lastSaved && (
                    <span className="text-slate-500 flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-500" />
                      Saved {new Date(lastSaved).toLocaleTimeString()}
                    </span>
                  )
                )}
              </span>
              <button
                type="button"
                onClick={deleteLetter}
                title="Delete"
                className="app-btn-secondary !p-2 text-red-600 hover:bg-red-50 hover:border-red-200"
              >
                <MotionIcon><Trash2 size={14} /></MotionIcon>
              </button>
            </div>
          </div>

          {['fullName', 'email', 'phone', 'location'].map((f) => (
            <div key={f}>
              <label className="app-label">{PERSONAL_LABELS[f]}</label>
              <input
                value={letter.personal?.[f] || ''}
                onChange={(e) => updatePersonal(f, e.target.value)}
                className="app-input text-sm"
              />
            </div>
          ))}

          {['recipientName', 'recipientTitle', 'companyName', 'companyAddress', 'date', 'salutation', 'closing'].map((f) => (
            <div key={f}>
              <label className="app-label">{LETTER_LABELS[f]}</label>
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
