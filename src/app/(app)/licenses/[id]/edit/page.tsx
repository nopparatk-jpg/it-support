'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import type { LicenseItem } from '@/lib/types';

export default function EditLicensePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/licenses/${id}`)
      .then(r => r.json())
      .then(data => setLicense(data.license))
      .finally(() => setLoading(false));
  }, [id]);

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
      usedSeats: Number(fd.get('usedSeats')),
      purchaseDate: fd.get('purchaseDate') || undefined,
      expiryDate: fd.get('expiryDate') || undefined,
      cost: fd.get('cost') ? Number(fd.get('cost')) : undefined,
      status: fd.get('status'),
      notes: fd.get('notes'),
    };
    const res = await fetch(`/api/licenses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) router.push(`/licenses/${id}`);
    else {
      const data = await res.json();
      setError(data.error || 'Failed to update');
      setSaving(false);
    }
  }

  if (loading) return <Spinner className="flex items-center justify-center py-12" />;
  if (!license) return <p className="py-12 text-center text-gray-500">License not found.</p>;

  const toDateStr = (d?: string) => d ? new Date(d).toISOString().split('T')[0] : '';

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit License</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Software Name *</label><input name="name" required defaultValue={license.name} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Vendor *</label><input name="vendor" required defaultValue={license.vendor} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">License Key *</label><input name="licenseKey" required defaultValue={license.licenseKey} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
            <select name="type" defaultValue={license.type} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="per-seat">Per-seat</option><option value="per-device">Per-device</option><option value="site">Site</option><option value="subscription">Subscription</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Total Seats *</label><input name="totalSeats" type="number" min="1" required defaultValue={license.totalSeats} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Used Seats</label><input name="usedSeats" type="number" min="0" defaultValue={license.usedSeats} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select name="status" defaultValue={license.status} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Purchase Date</label><input name="purchaseDate" type="date" defaultValue={toDateStr(license.purchaseDate)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Expiry Date</label><input name="expiryDate" type="date" defaultValue={toDateStr(license.expiryDate)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Cost</label><input name="cost" type="number" defaultValue={license.cost ?? ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        </div>
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Notes</label><textarea name="notes" rows={3} defaultValue={license.notes ?? ''} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Update License'}</button>
        </div>
      </form>
    </div>
  );
}
