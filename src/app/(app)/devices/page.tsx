'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/error-alert';
import { formatDate } from '@/lib/utils';
import { DEVICE_STATUS_OPTIONS, DEVICE_STATUS_LABELS } from '@/lib/constants';
import type { DeviceItem } from '@/lib/types';
import { Plus, Search, ChevronLeft, ChevronRight, Download, Upload } from 'lucide-react';

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (type) params.set('type', type);
      if (status) params.set('status', status);
      if (search) params.set('search', search);

      const res = await fetch(`/api/devices?${params}`);
      if (!res.ok) throw new Error('Failed to load devices');
      const data = await res.json();
      setDevices(data.devices ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [page, type, status, search]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    fetch('/api/settings/deviceTypes')
      .then((r) => r.json())
      .then((d) => setDeviceTypes(d.deviceTypes ?? []))
      .catch(() => {});
  }, []);

  const handleExport = () => {
    window.open('/api/devices/export', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Link href="/devices/new">
            <Button>
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search devices..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {deviceTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {DEVICE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{DEVICE_STATUS_LABELS[s]}</option>
            ))}
          </Select>
        </div>
      </Card>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : devices.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">No devices found</p>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Serial #</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Warranty</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr
                    key={d._id}
                    onClick={() => router.push(`/devices/${d._id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{d.name || `${d.brand} ${d.model}`}</p>
                      <p className="text-xs text-gray-500">{d.brand} {d.model}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.type}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.serialNumber}</td>
                    <td className="px-4 py-3">
                      <StatusBadge type="device" value={d.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {d.warrantyExpiry ? formatDate(d.warrantyExpiry) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
