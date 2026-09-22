import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, Landmark, Smartphone, Wallet } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Skeleton from '../components/common/Skeleton';
import { adminAPI } from '../services/api';
import { PAYMENT_METHOD_TYPES, paymentMethodTitle } from '../utils/paymentMethods';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';

const TYPE_ICON = { easypaisa: Smartphone, jazzcash: Smartphone, bank: Landmark, other: Wallet };

const EMPTY_FORM = { type: 'easypaisa', label: '', accountName: '', accountNumber: '', note: '', isActive: true };

function MethodForm({ initial, saving, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={submit} className="app-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">{initial._id ? 'Edit payment method' : 'Add payment method'}</h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600" aria-label="Cancel">
          <X size={18} />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="app-label" htmlFor="pm-type">Type</label>
          <select id="pm-type" value={form.type} onChange={set('type')} className="app-input">
            {PAYMENT_METHOD_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="app-label" htmlFor="pm-label">
            Display name <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="pm-label"
            value={form.label}
            onChange={set('label')}
            className="app-input"
            placeholder="e.g. Meezan Bank"
            maxLength={60}
          />
        </div>
        <div>
          <label className="app-label" htmlFor="pm-name">Account name</label>
          <input
            id="pm-name"
            value={form.accountName}
            onChange={set('accountName')}
            className="app-input"
            placeholder="Name on the account"
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className="app-label" htmlFor="pm-number">Account number</label>
          <input
            id="pm-number"
            value={form.accountNumber}
            onChange={set('accountNumber')}
            className="app-input"
            placeholder="03XX-XXXXXXX or IBAN"
            maxLength={60}
            required
          />
        </div>
      </div>

      <div>
        <label className="app-label" htmlFor="pm-note">
          Note <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="pm-note"
          value={form.note}
          onChange={set('note')}
          rows={2}
          className="app-input"
          placeholder="Branch code, IBAN, or any instruction for the user"
          maxLength={300}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
        />
        Show this to users
      </label>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="app-btn-secondary" disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="app-btn-primary gap-2" disabled={saving}>
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function AdminPaymentSettingsPage() {
  const toast = useToast();
  const confirmDialog = useConfirm();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  // null = form closed, EMPTY_FORM = adding, a method = editing it
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminAPI
      .paymentMethods()
      .then(({ data }) => setMethods(data?.methods || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Could not load payment methods'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (form) => {
    setSaving(true);
    try {
      if (form._id) await adminAPI.updatePaymentMethod(form._id, form);
      else await adminAPI.createPaymentMethod(form);
      toast.success('Payment method saved');
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not save payment method');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (method) => {
    try {
      await adminAPI.updatePaymentMethod(method._id, { ...method, isActive: !method.isActive });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update');
    }
  };

  const remove = async (method) => {
    const ok = await confirmDialog({
      title: 'Delete this payment method?',
      message: `${paymentMethodTitle(method)} (${method.accountNumber}) will no longer be shown to users.`,
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await adminAPI.deletePaymentMethod(method._id);
      toast.success('Payment method deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-medium text-brand-600 tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Payment Settings
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Accounts users see when they request a paid plan. Add Easypaisa, JazzCash or bank details.
            </p>
          </div>
          {!editing && (
            <button type="button" onClick={() => setEditing(EMPTY_FORM)} className="app-btn-primary !py-2 gap-2 shrink-0">
              <Plus size={16} /> Add method
            </button>
          )}
        </div>

        {editing && (
          <div className="mb-6">
            <MethodForm
              key={editing._id || 'new'}
              initial={editing}
              saving={saving}
              onCancel={() => setEditing(null)}
              onSave={save}
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <Skeleton shape="rounded" className="h-24 w-full" />
            <Skeleton shape="rounded" className="h-24 w-full" />
          </div>
        ) : methods.length === 0 ? (
          <div className="app-card p-10 text-center">
            <Landmark className="mx-auto text-slate-300 mb-3" size={36} />
            <p className="text-slate-700 font-medium">No payment methods yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Add one so users know where to send their payment.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {methods.map((m) => {
              const Icon = TYPE_ICON[m.type] || Wallet;
              return (
                <li key={m._id} className={`app-card p-4 flex items-start gap-4 ${m.isActive ? '' : 'opacity-60'}`}>
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{paymentMethodTitle(m)}</p>
                      {!m.isActive && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{m.accountName}</p>
                    <p className="text-sm font-mono text-slate-900 break-all">{m.accountNumber}</p>
                    {m.note && <p className="text-xs text-slate-500 mt-1">{m.note}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleActive(m)}
                      className="text-xs font-medium text-slate-600 hover:text-brand-600 px-2 py-1"
                    >
                      {m.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(m)}
                      className="p-2 text-slate-500 hover:text-brand-600"
                      aria-label="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(m)}
                      className="p-2 text-slate-500 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
