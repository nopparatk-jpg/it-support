'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewLicensePage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get('name'),
      licenseKey: fd.get('licenseKey'),
      type: fd.get('type'),
      vendor: fd.get('vendor'),
      totalSeats: Number(fd.get('totalSeats')),
      purchaseDate: fd.get('purchaseDate') || undefined,
      expiryDate: fd.get('expiryDate') || undefined,
      cost: fd.get('cost') ? Number(fd.get('cost')) : undefined,
      notes: fd.get('notes'),
    };
    const res = await fetch('/api/licenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) {
      const data = await res.json();
      router.push(`/licenses/${data.license._id}`);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create license');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add License</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Software Name *</label><input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Vendor *</label><input name="vendor" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">License Key *</label><input name="licenseKey" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select name="type" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="per-seat">Per-seat</option>
              <option value="per-device">Per-device</option>
              <option value="site">Site</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Total Seats *</label><input name="totalSeats" type="number" min="1" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Purchase Date</label><input name="purchaseDate" type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Expiry Date</label><input name="expiryDate" type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Cost</label><input name="cost" type="number" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Notes</label><textarea name="notes" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create License'}</button>
        </div>
      </form>
    </div>
  );
}
