import { Plus, Trash2 } from 'lucide-react';

export default function DynamicListField({
  title,
  items = [],
  fields,
  onChange,
  emptyItem,
}) {
  const update = (index, key, value) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [key]: value } : item
    );
    onChange(next);
  };

  const add = () =>
    onChange([...items, { ...emptyItem, _localId: `${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          <Plus size={16} /> Add More
        </button>
      </div>
      {items.map((item, index) => (
        <div
          key={item._localId || item._id || `row-${index}`}
          className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-500">#{index + 1}</span>
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={item[f.key] || ''}
                    onChange={(e) => update(index, f.key, e.target.value)}
                    rows={3}
                    className="app-input text-sm"
                  />
                ) : f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!item[f.key]}
                      onChange={(e) => update(index, f.key, e.target.checked)}
                    />
                    {f.label}
                  </label>
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={item[f.key] || ''}
                    onChange={(e) => update(index, f.key, e.target.value)}
                    className="app-input text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!items.length && (
        <button
          type="button"
          onClick={add}
          className="w-full py-6 border border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-brand-500 hover:text-brand-600"
        >
          + Add {title}
        </button>
      )}
    </div>
  );
}
