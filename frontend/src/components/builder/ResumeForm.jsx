import { useForm } from 'react-hook-form';
import { useEffect, useRef } from 'react';
import DynamicListField from './DynamicListField';
import ThemeCustomizer from './ThemeCustomizer';
import SectionOrder from './SectionOrder';
import { uploadAPI } from '../../services/api';

export default function ResumeForm({ resume, onUpdate, userPlan }) {
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
      alert('Photo upload failed. Configure Cloudinary or use local storage.');
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
            (field) => (
              <div key={field}>
                <label className="app-label capitalize">{field}</label>
                <input
                  {...register(`personal.${field}`)}
                  className="app-input text-sm"
                />
              </div>
            )
          )}
        </div>
        <div>
          <label className="app-label">Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhoto} className="mt-1 text-sm" />
        </div>
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
          { key: 'startDate', label: 'Start Date' },
          { key: 'endDate', label: 'End Date' },
          { key: 'current', label: 'Currently working', type: 'checkbox' },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
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
          { key: 'startDate', label: 'Start' },
          { key: 'endDate', label: 'End' },
          { key: 'description', label: 'Notes', type: 'textarea', full: true },
        ]}
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
          { key: 'url', label: 'URL' },
          { key: 'technologies', label: 'Technologies' },
          { key: 'description', label: 'Description', type: 'textarea', full: true },
        ]}
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
          { key: 'url', label: 'URL' },
        ]}
      />

      <ThemeCustomizer theme={resume.theme} onChange={updateTheme} userPlan={userPlan} />

      {['pro', 'premium'].includes(userPlan) && (
        <SectionOrder order={resume.sectionOrder || []} onChange={updateOrder} />
      )}
    </div>
  );
}
