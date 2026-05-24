'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

function SettingSection({ title, settingKey }: { title: string; settingKey: string }) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValue, setNewValue] = useState('');
  const [error, setError] = useState('');

  const fetchValues = useCallback(() => {
    setLoading(true);
    fetch(`/api/settings/${settingKey}`)
      .then(r => r.json())
      .then(data => setValues(data.values ?? []))
      .finally(() => setLoading(false));
  }, [settingKey]);

  useEffect(() => { fetchValues(); }, [fetchValues]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newValue.trim()) return;
    setError('');
    const updated = [...values, newValue.trim()];
    const res = await fetch(`/api/settings/${settingKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: updated }),
    });
    if (res.ok) { setNewValue(''); fetchValues(); }
    else { const d = await res.json(); setError(d.error); }
  }

  async function handleRemove(val: string) {
    const updated = values.filter(v => v !== val);
    await fetch(`/api/settings/${settingKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: updated }),
    });
    fetchValues();
  }

  if (loading) return <Spinner className="flex items-center justify-center py-6" />;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <form onSubmit={handleAdd} className="mb-4 flex gap-2">
        <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={`New ${title.toLowerCase().replace(/s$/, '')}...`} className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add</button>
      </form>
      {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {values.map(val => (
          <span key={val} className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
            {val}
            <button onClick={() => handleRemove(val)} className="ml-1 text-gray-400 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <SettingSection title="Device Types" settingKey="deviceTypes" />
      <SettingSection title="Departments" settingKey="departments" />
    </div>
  );
}
