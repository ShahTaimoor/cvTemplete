import { useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import { Upload, Lock } from 'lucide-react';
import DynamicListField from './DynamicListField';
import UpgradePrompt from './UpgradePrompt';
import { canUsePaidFields } from '../../utils/plans';
import ThemeCustomizer from './ThemeCustomizer';
import SectionOrder from './SectionOrder';
import { uploadAPI } from '../../services/api';
import { templateSupportsPhoto } from '../../config/templates';
import { useToast } from '../../hooks/useToast';

// Personal fields that need a paid plan, with the name shown in the upgrade prompt.
const PAID_PERSONAL_FIELDS = {
  email: 'Email',
  phone: 'Phone number',
  website: 'Website link',
  linkedin: 'LinkedIn link',
};

export default function ResumeForm({ resume, onUpdate, userPlan }) {
  const toast = useToast();
  const paid = canUsePaidFields(userPlan);
  const [lockedFeature, setLockedFeature] = useState(null);
  const { register, watch, reset } = useForm({ defaultValues: resume });
  const resumeRef = useRef(resume);
  resumeRef.current = resume;

  useEffect(() => {
    reset(resume);
  }, [resume._id, reset]);

  // Sync only registered form fields — lists & sectionOrder are updated via onChange handlers
  useEffect(() => {
    const sub = watch((data) => {
      const r = resumeRef.current;
      if (!r) return;
      onUpdate({
        ...r,
        title: data.title ?? r.title,
        summary: data.summary ?? r.summary,
        personal: { ...r.personal, ...(data.personal || {}) },
      });
    });
    return () => sub.unsubscribe();
  }, [watch, onUpdate]);

  const updateList = (key, value) => onUpdate({ ...resumeRef.current, [key]: value });
  const updateTheme = (theme) => onUpdate({ ...resumeRef.current, theme });
  const updateOrder = (sectionOrder) => onUpdate({ ...resumeRef.current, sectionOrder });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { data } = await uploadAPI.photo(file);
      const url = data.url.startsWith('http') ? data.url : `http://localhost:5000${data.url}`;
      const r = resumeRef.current;
      onUpdate({ ...r, personal: { ...r.personal, photo: url } });
    } catch {
      toast.error('Photo upload failed. Configure Cloudinary or use local storage.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="app-label">Resume Title</label>
        <input {...register('title')} className="app-input" />
      </div>

      <section className="space-y-3">
        <h3 className="font-semibold text-slate-900">Personal Information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {['fullName', 'jobTitle', 'email', 'phone', 'location', 'website', 'linkedin'].map(
            (field) => {
              const lockLabel = PAID_PERSONAL_FIELDS[field];
              const locked = !!lockLabel && !paid;
              return (
                <div key={field}>
                  <label className="app-label capitalize flex items-center gap-1">
                    {field}
                    {locked && <Lock size={12} className="text-amber-500" aria-label="Paid feature" />}
                  </label>
                  <input
                    {...register(`personal.${field}`)}
                    readOnly={locked}
                    onClick={locked ? () => setLockedFeature(lockLabel) : undefined}
                    className={`app-input text-sm ${locked ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
                  />
                </div>
              );
            }
          )}
        </div>
        {templateSupportsPhoto(resume.templateSlug) && (
          <div>
            <label className="app-label flex items-center gap-1">
              Profile Photo
              {!paid && <Lock size={12} className="text-amber-500" aria-label="Paid feature" />}
            </label>
            {paid ? (
              <label className="app-btn-secondary cursor-pointer inline-flex w-fit gap-2">
                <Upload size={16} />
                Choose Photo
                <input type="file" accept="image/*" onChange={handlePhoto} className="sr-only" />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => setLockedFeature('Profile photo')}
                className="app-btn-secondary inline-flex w-fit gap-2"
              >
                <Upload size={16} />
                Choose Photo
              </button>
            )}
          </div>
        )}
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 mb-2">Professional Summary</h3>
        <textarea {...register('summary')} rows={4} className="app-input text-sm" />
      </section>

      <DynamicListField
        title="Experience"
        items={resume.experience || []}
        onChange={(v) => updateList('experience', v)}
        emptyItem={{
          company: '', position: '', location: '', startDate: '', endDate: '',
          current: false, description: '',
        }}
        fields={[
          { key: 'position', label: 'Position' },
          { key: 'company', label: 'Company' },
          { key: 'location', label: 'Location' },
          { key: 'startDate', label: 'Start Date', locked: !paid, lockLabel: 'Job start date' },
          { key: 'endDate', label: 'End Date', locked: !paid, lockLabel: 'Job end date' },
          { key: 'current', label: 'Currently working', type: 'checkbox', locked: !paid, lockLabel: 'Job dates' },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
        onLockedClick={setLockedFeature}
      />

      <DynamicListField
        title="Education"
        items={resume.education || []}
        onChange={(v) => updateList('education', v)}
        emptyItem={{
          institution: '', degree: '', field: '', startDate: '', endDate: '', description: '',
        }}
        fields={[
          { key: 'institution', label: 'Institution' },
          { key: 'degree', label: 'Degree' },
          { key: 'field', label: 'Field of Study' },
          { key: 'startDate', label: 'Start', locked: !paid, lockLabel: 'Education start date' },
          { key: 'endDate', label: 'End', locked: !paid, lockLabel: 'Education end date' },
          { key: 'description', label: 'Notes', type: 'textarea', full: true },
        ]}
        onLockedClick={setLockedFeature}
      />

      <DynamicListField
        title="Skills"
        items={resume.skills || []}
        onChange={(v) => updateList('skills', v)}
        emptyItem={{ name: '', level: '' }}
        fields={[
          { key: 'name', label: 'Skill' },
          { key: 'level', label: 'Level (optional)' },
        ]}
      />

      <DynamicListField
        title="Projects"
        items={resume.projects || []}
        onChange={(v) => updateList('projects', v)}
        emptyItem={{ name: '', url: '', technologies: '', description: '' }}
        fields={[
          { key: 'name', label: 'Project Name' },
          { key: 'url', label: 'URL', locked: !paid, lockLabel: 'Project URL' },
          { key: 'technologies', label: 'Technologies' },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
        onLockedClick={setLockedFeature}
      />

      <DynamicListField
        title="Certifications"
        items={resume.certifications || []}
        onChange={(v) => updateList('certifications', v)}
        emptyItem={{ name: '', issuer: '', date: '', url: '' }}
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'issuer', label: 'Issuer' },
          { key: 'date', label: 'Date' },
          { key: 'url', label: 'URL', locked: !paid, lockLabel: 'Certification URL' },
        ]}
        onLockedClick={setLockedFeature}
      />

      <ThemeCustomizer theme={resume.theme} onChange={updateTheme} userPlan={userPlan} />

      {['pro', 'premium'].includes(userPlan) && (
        <SectionOrder order={resume.sectionOrder || []} onChange={updateOrder} />
      )}

      {lockedFeature && <UpgradePrompt feature={lockedFeature} onClose={() => setLockedFeature(null)} />}
    </div>
  );
}
