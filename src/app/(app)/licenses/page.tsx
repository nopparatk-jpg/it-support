'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/status-badge';
import { formatDate } from '@/lib/utils';
import type { LicenseItem } from '@/lib/types';

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));

    fetch(`/api/licenses?${params}`)
      .then(r => r.json())
      .then(data => {
        setLicenses(data.licenses ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [status, type, search, page]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
        <Link href="/licenses/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Plus className="h-4 w-4" /> Add License
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-4">
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={type} onChange={e => { setType(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">All Types</option>
            <option value="per-seat">Per-seat</option>
            <option value="per-device">Per-device</option>
            <option value="site">Site</option>
            <option value="subscription">Subscription</option>
          </select>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search licenses..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-sm w-64" />
          </div>
        </div>

        {loading ? (
          <Spinner className="flex items-center justify-center py-12" />
        ) : licenses.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No licenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3">Software</th>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Seats</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {licenses.map(l => (
                  <tr key={l._id} className="cursor-pointer hover:bg-gray-50" onClick={() => window.location.href = `/licenses/${l._id}`}>
                    <td className="px-4 py-3 text-gray-900">{l.name}</td>
                    <td className="px-4 py-3 text-gray-600">{l.vendor}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{l.type}</td>
                    <td className="px-4 py-3 text-gray-900">{l.usedSeats} / {l.totalSeats}</td>
                    <td className="px-4 py-3 text-gray-500">{l.expiryDate ? formatDate(l.expiryDate) : '-'}</td>
                    <td className="px-4 py-3"><StatusBadge type="license" value={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <span className="text-sm text-gray-500">Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50">Previous</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)} className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
