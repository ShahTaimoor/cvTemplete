import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { canCustomizeColors } from '../../utils/plans';

const FONTS = ['Inter', 'Roboto', 'Playfair Display'];

export default function ThemeCustomizer({ theme, onChange, userPlan }) {
  const allowed = canCustomizeColors(userPlan);

  if (!allowed) {
    return (
      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-center">
        <Lock className="mx-auto text-amber-400 mb-2" size={24} />
        <p className="text-sm text-slate-400 mb-2">Color customization requires Pro plan</p>
        <Link to="/pricing" className="text-sm text-blue-400 hover:underline">
          Upgrade to Unlock
        </Link>
      </div>
    );
  }

  const colors = [
    { key: 'primaryColor', label: 'Primary' },
    { key: 'secondaryColor', label: 'Secondary' },
    { key: 'backgroundColor', label: 'Background' },
  ];

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
      <h3 className="font-semibold text-slate-900">Theme Colors</h3>
      {colors.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <label className="text-sm text-slate-600">{label}</label>
          <input
            type="color"
            value={theme?.[key] || '#2563eb'}
            onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
            className="w-10 h-8 rounded cursor-pointer bg-transparent"
          />
        </div>
      ))}
      <div>
        <label className="text-sm text-slate-600 block mb-1">Font</label>
        <select
          value={theme?.fontFamily || 'Inter'}
          onChange={(e) => onChange({ ...theme, fontFamily: e.target.value })}
          className="app-input text-sm"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
