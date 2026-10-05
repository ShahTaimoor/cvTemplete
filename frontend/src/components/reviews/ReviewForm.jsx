import { useState } from 'react';
import { Star, Loader2, ImagePlus } from 'lucide-react';
import { uploadAPI } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Avatar } from './reviewUtils';

// Shared by the landing-page "Write a review" modal and the admin editor.
export default function ReviewForm({ initial, saving, submitLabel = 'Submit', onCancel, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadAPI.photo(file);
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar name={form.name} image={form.image} size={56} />
        <label className="app-btn-secondary gap-2 cursor-pointer">
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {form.image ? 'Change photo' : 'Add photo'}
          <input type="file" accept="image/*" className="hidden" onChange={pickImage} disabled={uploading} />
        </label>
        {form.image && (
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-red-600"
            onClick={() => setForm((f) => ({ ...f, image: '' }))}
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="app-label" htmlFor="rv-name">Name</label>
          <input id="rv-name" className="app-input" value={form.name} onChange={set('name')} maxLength={80} required />
        </div>
        <div>
          <label className="app-label" htmlFor="rv-role">
            Role / company <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="rv-role"
            className="app-input"
            value={form.role}
            onChange={set('role')}
            maxLength={80}
            placeholder="e.g. Software Engineer"
          />
        </div>
      </div>

      <div>
        <span className="app-label">Rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setForm((f) => ({ ...f, rating: n }))} aria-label={`${n} stars`}>
              <Star size={26} className={n <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="app-label" htmlFor="rv-text">Your review</label>
        <textarea id="rv-text" className="app-input min-h-[110px]" value={form.text} onChange={set('text')} maxLength={600} required />
        <p className="text-xs text-slate-400 text-right mt-1">{form.text.length}/600</p>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="app-btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="app-btn-primary gap-2" disabled={saving || uploading}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
