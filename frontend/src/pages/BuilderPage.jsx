import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import { Download, LayoutTemplate, CheckCircle, Share2, BarChart3, LineChart, FileImage, FileType, History, Mail, X } from 'lucide-react';
import { fetchResume, setCurrentResume } from '../store/resumeSlice';
import { fetchTemplates } from '../store/templateSlice';
import { resumeAPI, coverLetterAPI, downloadBlob } from '../services/api';
import ResumeForm from '../components/builder/ResumeForm';
import ResumePreview from '../components/resume/ResumePreview';
import TemplateGallery from '../components/dashboard/TemplateGallery';
import AnalyticsModal from '../components/analytics/AnalyticsModal';
import { useAutoSave } from '../hooks/useAutoSave';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { getTemplatePreset } from '../config/templates';
import { exportElementToPdf, exportElementToPng } from '../utils/exportPreview';
import DashboardLayout from '../components/layout/DashboardLayout';

export default function BuilderPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { current, saving, lastSaved } = useSelector((s) => s.resume);
  const { user } = useSelector((s) => s.auth);
  const { items: templates } = useSelector((s) => s.templates);
  const [localResume, setLocalResume] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [atsResult, setAtsResult] = useState(null);
  const [mobileTab, setMobileTab] = useState('edit');
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [exporting, setExporting] = useState(false);
  const previewRef = useRef(null);

  const plan = user?.subscription?.plan || 'free';

  const getPreviewEl = () =>
    previewRef.current?.querySelector('[data-print-root]') || previewRef.current;

  const safeFilename = (ext) =>
    `${(localResume?.title || 'resume').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}.${ext}`;

  useEffect(() => {
    dispatch(fetchResume(id));
    dispatch(fetchTemplates());
    resumeAPI.versions(id).then((r) => setVersions(r.data)).catch(() => {});
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(fetchTemplates());
  }, [plan, dispatch]);

  // Only hydrate from server when opening this resume — don't overwrite local edits on every Redux update
  useEffect(() => {
    if (current?._id === id) {
      setLocalResume((prev) => (prev?._id === id ? prev : current));
    }
  }, [current?._id, id, current]);

  useAutoSave(localResume);

  const handleUpdate = useCallback((updated) => {
    setLocalResume(updated);
    dispatch(setCurrentResume(updated));
  }, [dispatch]);

  const applyTemplate = useCallback(
    (template) => {
      if (template.locked) return;
      const preset = getTemplatePreset(template.slug);
      setLocalResume((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          templateSlug: template.slug,
          theme: {
            primaryColor: preset.primary,
            secondaryColor: preset.secondary,
            backgroundColor: preset.bg,
            fontFamily: preset.font,
          },
        };
        dispatch(setCurrentResume(updated));
        return updated;
      });
      setMobileTab('preview');
    },
    [dispatch]
  );

  const switchTemplate = async (template) => {
    applyTemplate(template);
    try {
      const preset = getTemplatePreset(template.slug);
      await resumeAPI.update(id, {
        templateSlug: template.slug,
        theme: {
          primaryColor: preset.primary,
          secondaryColor: preset.secondary,
          backgroundColor: preset.bg,
          fontFamily: preset.font,
        },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Template switch failed');
    }
  };

  const downloadPdf = async () => {
    const el = getPreviewEl();
    if (!el) {
      toast.info('Switch to Preview tab first, then download PDF.');
      return;
    }
    setExporting(true);
    try {
      if (mobileTab === 'edit') setMobileTab('preview');
      await new Promise((r) => setTimeout(r, 400));
      await exportElementToPdf(getPreviewEl(), safeFilename('pdf'));
      resumeAPI.trackDownload(id, 'pdf').catch(() => {});
    } catch (err) {
      toast.error(err.message || 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  const downloadDocx = async () => {
    try {
      const { data } = await resumeAPI.docx(id);
      downloadBlob(data, `${localResume?.title || 'resume'}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } catch {
      toast.error('DOCX export failed');
    }
  };

  const downloadPng = async () => {
    const el = getPreviewEl();
    if (!el) {
      toast.info('Switch to Preview tab first, then download PNG.');
      return;
    }
    setExporting(true);
    try {
      if (mobileTab === 'edit') setMobileTab('preview');
      await new Promise((r) => setTimeout(r, 400));
      await exportElementToPng(getPreviewEl(), safeFilename('png'));
      resumeAPI.trackDownload(id, 'png').catch(() => {});
    } catch (err) {
      toast.error(err.message || 'PNG export failed');
    } finally {
      setExporting(false);
    }
  };

  const saveVersion = async () => {
    const name = await confirmDialog({
      title: 'Save version',
      inputMode: true,
      inputLabel: 'Version name (e.g. Google application)',
      defaultValue: `v${versions.length + 1}`,
      confirmLabel: 'Save',
    });
    if (!name) return;
    const { data } = await resumeAPI.saveVersion(id, { name });
    setVersions((v) => [data, ...v]);
    toast.success(`Version saved as "${name}"`);
  };

  const restoreVersion = async (versionId) => {
    const ok = await confirmDialog({
      title: 'Restore this version?',
      message: 'Current content will be replaced.',
      confirmLabel: 'Restore',
      destructive: true,
    });
    if (!ok) return;
    const { data } = await resumeAPI.restoreVersion(id, versionId);
    setLocalResume(data);
    dispatch(setCurrentResume(data));
    toast.success('Version restored');
  };

  const createCoverLetter = async () => {
    try {
      const { data } = await coverLetterAPI.create({ resumeId: id });
      window.location.href = `/cover-letter/${data._id}`;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cover letter requires Premium');
    }
  };

  const runAts = async () => {
    try {
      const { data } = await resumeAPI.atsCheck(id);
      setAtsResult(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'ATS check unavailable');
    }
  };

  const shareResume = async () => {
    try {
      const { data } = await resumeAPI.share(id);
      navigator.clipboard.writeText(data.shareUrl);
      toast.success('Share link copied!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Share requires Premium');
    }
  };

  if (!localResume) {
    return (
      <DashboardLayout fullHeight>
        <div className="h-full flex items-center justify-center text-slate-500">Loading resume...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout fullHeight>
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/dashboard" className="text-xs text-brand-600 font-medium hidden sm:inline hover:underline">
            Dashboard
          </Link>
          <h1 className="font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">{localResume.title}</h1>
          <span className="text-xs text-slate-500 hidden sm:flex items-center gap-1">
            {saving ? 'Saving...' : lastSaved && (
              <>
                <CheckCircle size={12} className="text-emerald-500" />
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </>
            )}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const next = !showTemplates;
              setShowTemplates(next);
              if (next) {
                setShowVersions(false);
                setMobileTab('edit');
              }
            }}
            className={`!py-1.5 !px-2 sm:!px-3 text-xs sm:text-sm gap-1 ${
              showTemplates ? 'app-btn-primary' : 'app-btn-secondary'
            }`}
          >
            <LayoutTemplate size={14} /> <span className="hidden sm:inline">Templates</span>
          </button>
          <button type="button" onClick={() => setShowVersions(!showVersions)} className="app-btn-secondary !py-1.5 !px-2 sm:!px-3">
            <History size={14} />
          </button>
          <button
            type="button"
            onClick={() => setShowAnalytics(true)}
            className="hidden sm:flex app-btn-secondary !py-1.5 gap-1 text-sm"
          >
            <LineChart size={14} /> Analytics
          </button>
          {['pro', 'premium'].includes(plan) && (
            <button type="button" onClick={runAts} className="hidden sm:flex app-btn-secondary !py-1.5 gap-1 text-sm">
              <BarChart3 size={14} /> ATS
            </button>
          )}
          {plan === 'premium' && (
            <button type="button" onClick={shareResume} className="hidden sm:flex app-btn-secondary !py-1.5 gap-1 text-sm">
              <Share2 size={14} /> Share
            </button>
          )}
          {plan === 'premium' && (
            <button type="button" onClick={createCoverLetter} className="app-btn-secondary !py-1.5 !px-2 sm:!px-3 gap-1 text-xs sm:text-sm">
              <Mail size={14} /> <span className="hidden sm:inline">Cover</span>
            </button>
          )}
          <button
            type="button"
            onClick={downloadPdf}
            disabled={exporting}
            className="app-btn-primary !py-1.5 !px-2 sm:!px-3 gap-1 text-xs sm:text-sm disabled:opacity-50"
          >
            <Download size={14} /> {exporting ? '...' : 'PDF'}
          </button>
          <button type="button" onClick={downloadDocx} className="hidden sm:flex app-btn-secondary !py-1.5 gap-1 text-sm">
            <FileType size={14} /> DOCX
          </button>
          <button type="button" onClick={downloadPng} className="hidden sm:flex app-btn-secondary !py-1.5 gap-1 text-sm">
            <FileImage size={14} /> PNG
          </button>
        </div>
      </div>

      <div className="lg:hidden flex border-b border-slate-200 bg-white shrink-0">
        {['edit', 'preview'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium capitalize ${
              mobileTab === tab ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500'
            }`}
          >
            {tab === 'edit' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>

      {showVersions && (
        <div className="p-4 border-b border-slate-200 bg-white text-sm shrink-0">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-slate-900">Saved versions</span>
            <button type="button" onClick={saveVersion} className="text-brand-600 text-xs font-medium">+ Save version</button>
          </div>
          {versions.length ? (
            <ul className="space-y-1 max-h-24 overflow-y-auto">
              {versions.map((v) => (
                <li key={v._id} className="flex justify-between items-center text-slate-600">
                  <span>{v.name}</span>
                  <button type="button" onClick={() => restoreVersion(v._id)} className="text-xs text-brand-600">Restore</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 text-xs">No versions yet</p>
          )}
        </div>
      )}

      {atsResult && (
        <div className="mx-4 mt-2 p-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 shrink-0">
          <strong>ATS: {atsResult.score}/100</strong> ({atsResult.grade})
        </div>
      )}

      <div className="flex-1 grid lg:grid-cols-2 overflow-hidden">
        <div
          className={`flex flex-col min-h-0 border-r border-slate-200 bg-white ${
            mobileTab !== 'edit' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {showTemplates ? (
            <>
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200 shrink-0">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Choose a template</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Preview updates on the right</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplates(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close templates"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <TemplateGallery
                  templates={templates}
                  selectedSlug={localResume.templateSlug}
                  onSelect={switchTemplate}
                  compact
                  totalCount={templates.length}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              <ResumeForm resume={localResume} onUpdate={handleUpdate} userPlan={plan} />
            </div>
          )}
        </div>
        <div
          ref={previewRef}
          className={`p-4 overflow-y-auto bg-slate-200 ${mobileTab !== 'preview' ? 'hidden lg:block' : ''}`}
        >
          <p className="text-xs text-slate-600 mb-2 text-center">
            Live Preview — <span className="text-brand-600 font-medium capitalize">{localResume.templateSlug?.replace(/-/g, ' ')}</span>
          </p>
          <ResumePreview resume={localResume} templateSlug={localResume.templateSlug} />
        </div>
      </div>

      <div className="lg:hidden flex gap-2 p-2 border-t border-slate-200 bg-white shrink-0">
        <button type="button" onClick={downloadDocx} className="flex-1 app-btn-secondary !py-2 text-xs">DOCX</button>
        <button type="button" onClick={downloadPng} className="flex-1 app-btn-secondary !py-2 text-xs">PNG</button>
      </div>

      <AnimatePresence>
        {showAnalytics && (
          <AnalyticsModal resumeId={id} plan={plan} onClose={() => setShowAnalytics(false)} />
        )}
      </AnimatePresence>
    </div>
    </DashboardLayout>
  );
}
