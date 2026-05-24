'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; errors: string[] } | null>(null);
  const [importError, setImportError] = useState('');

  const fetchLicenses = () => {
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
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLicenses(); }, [status, type, search, page]);

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImportError('');
    setImportResult(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get('file') as File | null;
    let csv = fd.get('csv') as string;

    if (file && file.size > 0) {
      csv = await file.text();
    }
    if (!csv?.trim()) { setImportError('Please paste CSV data or upload a file'); return; }

    const res = await fetch('/api/licenses/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportResult(data.results);
      fetchLicenses();
    } else {
      setImportError(data.error || 'Import failed');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Licenses</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(true); setImportResult(null); setImportError(''); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" /> Import CSV
          </button>
          <Link href="/licenses/new" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add License
          </Link>
        </div>
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

      {/* Import Dialog */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Import Licenses (CSV)</h2>
            <p className="mb-1 text-sm text-gray-500">Columns: name, licenseKey, type, vendor, totalSeats, expiryDate, cost, status</p>
            <p className="mb-3 text-xs text-gray-400">Upload a .csv file or paste CSV data below. Type defaults to &quot;per-seat&quot;, status to &quot;active&quot;.</p>
            {importError && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{importError}</div>}
            {importResult && (
              <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Created: {importResult.created}, Skipped: {importResult.skipped}
                {importResult.errors.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-xs text-red-600">
                    {importResult.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                )}
              </div>
            )}
            <form onSubmit={handleImport} className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Upload CSV File</label>
                <input name="file" type="file" accept=".csv,text/csv" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div className="relative flex items-center">
                <div className="flex-grow border-t border-gray-200" />
                <span className="mx-3 flex-shrink text-xs text-gray-400">or paste CSV</span>
                <div className="flex-grow border-t border-gray-200" />
              </div>
              <textarea name="csv" rows={6} placeholder={"name,licenseKey,type,vendor,totalSeats,expiryDate,cost,status\nMicrosoft 365,MS365-XXXX,per-seat,Microsoft,50,2027-12-31,150000,active"} className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowImport(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
