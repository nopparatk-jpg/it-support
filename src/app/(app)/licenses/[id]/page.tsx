'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { LicenseItem } from '@/lib/types';

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/licenses/${id}`)
      .then(r => r.json())
      .then(data => setLicense(data.license))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this license?')) return;
    const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/licenses');
  }

  if (loading) return <Spinner className="flex items-center justify-center py-12" />;
  if (!license) return <p className="py-12 text-center text-gray-500">License not found.</p>;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/licenses" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold text-gray-900">{license.name}</h1>
          <StatusBadge type="license" value={license.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/licenses/${id}/edit`} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Edit className="h-4 w-4" /> Edit</Link>
          <button onClick={handleDelete} className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="grid grid-cols-2 gap-6">
          <div><p className="text-sm text-gray-500">Vendor</p><p className="font-medium text-gray-900">{license.vendor}</p></div>
          <div><p className="text-sm text-gray-500">Type</p><p className="font-medium text-gray-900 capitalize">{license.type}</p></div>
          <div><p className="text-sm text-gray-500">License Key</p><p className="font-mono text-gray-900">{license.licenseKey}</p></div>
          <div><p className="text-sm text-gray-500">Seats</p><p className="font-medium text-gray-900">{license.usedSeats} / {license.totalSeats} used</p></div>
          <div><p className="text-sm text-gray-500">Purchase Date</p><p className="text-gray-900">{license.purchaseDate ? formatDate(license.purchaseDate) : '-'}</p></div>
          <div><p className="text-sm text-gray-500">Expiry Date</p><p className="text-gray-900">{license.expiryDate ? formatDate(license.expiryDate) : '-'}</p></div>
          <div><p className="text-sm text-gray-500">Cost</p><p className="text-gray-900">{license.cost ? formatCurrency(license.cost) : '-'}</p></div>
          <div><p className="text-sm text-gray-500">Status</p><StatusBadge type="license" value={license.status} /></div>
        </div>
        {license.notes && (
          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">Notes</p>
            <p className="mt-1 text-gray-900">{license.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
