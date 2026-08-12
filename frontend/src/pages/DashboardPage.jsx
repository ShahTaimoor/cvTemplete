import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Trash2, FileText, Copy, Mail, Crown } from 'lucide-react';
import { fetchResumes } from '../store/resumeSlice';
import { fetchTemplates } from '../store/templateSlice';
import { resumeAPI, coverLetterAPI } from '../services/api';
import TemplatePickerModal from '../components/dashboard/TemplatePickerModal';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useConfirm } from '../hooks/useConfirm';
import { useToast } from '../hooks/useToast';
import { staggerContainer, staggerItem } from '../lib/motion';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const confirmDialog = useConfirm();
  const toast = useToast();
  const { list } = useSelector((s) => s.resume);
  const { user } = useSelector((s) => s.auth);
  const { items: templates } = useSelector((s) => s.templates);
  const [showNew, setShowNew] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState('classic-blue');
  const [coverLetters, setCoverLetters] = useState([]);
  const plan = user?.subscription?.plan || 'free';

  useEffect(() => {
    dispatch(fetchResumes());
    dispatch(fetchTemplates());
    if (plan === 'premium') {
      coverLetterAPI.list().then((r) => setCoverLetters(r.data)).catch(() => {});
    }
  }, [dispatch, plan]);

  const createResume = async () => {
    try {
      const { data } = await resumeAPI.create({
        templateSlug: selectedSlug,
        withSampleData: list.length === 0,
      });
      navigate(`/builder/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create resume');
    }
  };

  const duplicateResume = async (resumeId, title) => {
    try {
      const { data } = await resumeAPI.duplicate(resumeId, { title: `${title} (Copy)` });
      dispatch(fetchResumes());
      navigate(`/builder/${data._id}`);
    } catch {
      toast.error('Duplicate failed');
    }
  };

  const deleteResume = async (id) => {
    const ok = await confirmDialog({
      title: 'Delete this resume?',
      message: 'This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    await resumeAPI.remove(id);
    dispatch(fetchResumes());
    toast.success('Resume deleted');
  };

  const newCoverLetter = async (resumeId) => {
    try {
      const { data } = await coverLetterAPI.create({ resumeId });
      navigate(`/cover-letter/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Premium required for cover letters');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-brand-600 mb-1">Dashboard</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-slate-600 mt-1">Manage resumes and pick templates for your next application.</p>
          </div>
          <button type="button" onClick={() => setShowNew(!showNew)} className="app-btn-primary shrink-0">
            <Plus size={18} className="mr-2" />
            New resume
          </button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="app-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resumes</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{list.length}</p>
          </div>
          <div className="app-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current plan</p>
            <p className="text-3xl font-bold text-slate-900 mt-1 capitalize flex items-center gap-2">
              <Crown size={22} className="text-amber-500" />
              {plan}
            </p>
          </div>
          <div className="app-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{templates.length || '—'}</p>
            <Link to="/pricing" className="text-sm text-brand-600 font-medium mt-2 inline-block hover:underline">
              Upgrade for more
            </Link>
          </div>
        </div>

        <AnimatePresence>
          {showNew && (
            <TemplatePickerModal
              templates={templates}
              selectedSlug={selectedSlug}
              onSelect={(tpl) => !tpl.locked && setSelectedSlug(tpl.slug)}
              onClose={() => setShowNew(false)}
              onCreate={createResume}
              isFirstResume={list.length === 0}
            />
          )}
        </AnimatePresence>

        {plan === 'premium' && coverLetters.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Mail size={18} className="text-brand-600" />
              Cover letters
            </h2>
            <div className="flex flex-wrap gap-2">
              {coverLetters.map((c) => (
                <Link
                  key={c._id}
                  to={`/cover-letter/${c._id}`}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:border-brand-300 hover:text-brand-700"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-slate-900 mb-4">Your resumes</h2>
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer()}
        >
          {list.map((r) => (
            <motion.article
              key={r._id}
              variants={staggerItem}
              className="app-card p-5 hover:border-brand-200 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 mb-3">
                <FileText size={20} />
              </div>
              <h3 className="font-semibold text-slate-900">{r.title}</h3>
              <p className="text-xs text-slate-500 mt-1 capitalize">{r.templateSlug?.replace(/-/g, ' ')}</p>
              <p className="text-xs text-slate-400 mt-2">
                Updated {new Date(r.updatedAt).toLocaleDateString()}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
                <Link to={`/builder/${r._id}`} className="app-btn-primary flex-1 text-center !py-2 min-w-[80px]">
                  Edit
                </Link>
                <button
                  type="button"
                  title="Duplicate"
                  onClick={() => duplicateResume(r._id, r.title)}
                  className="app-btn-secondary !p-2"
                >
                  <Copy size={18} />
                </button>
                {plan === 'premium' && (
                  <button
                    type="button"
                    title="Cover letter"
                    onClick={() => newCoverLetter(r._id)}
                    className="app-btn-secondary !p-2 text-brand-600"
                  >
                    <Mail size={18} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteResume(r._id)}
                  className="app-btn-secondary !p-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.article>
          ))}
          {!list.length && (
            <div className="col-span-full app-card p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-3" size={40} />
              <p className="text-slate-600 font-medium">No resumes yet</p>
              <p className="text-sm text-slate-500 mt-1">Create your first resume — we add sample content automatically.</p>
              <button type="button" onClick={() => setShowNew(true)} className="app-btn-primary mt-4">
                <Plus size={18} className="mr-2" />
                Create resume
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
