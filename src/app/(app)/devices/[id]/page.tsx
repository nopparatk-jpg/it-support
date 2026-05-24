'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { DeviceItem, AssignmentItem, UserItem } from '@/lib/types';
import { ArrowLeft, Edit, UserPlus, RotateCcw } from 'lucide-react';

export default function DeviceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [device, setDevice] = useState<DeviceItem | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [currentAssignee, setCurrentAssignee] = useState<{ _id: string; name: string; email: string } | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchDevice = async () => {
    try {
      const res = await fetch(`/api/devices/${id}`);
      if (!res.ok) throw new Error('Failed to load device');
      const data = await res.json();
      setDevice(data.device ?? data);
      setAssignments(data.assignments ?? []);
      setCurrentAssignee(data.currentAssignee ?? null);
    } catch {
      setError('Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAssign = async () => {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/devices/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (res.ok) {
        setAssignDialogOpen(false);
        setSelectedUserId('');
        await fetchDevice();
      }
    } catch {
      // silent
    } finally {
      setAssigning(false);
    }
  };

  const handleReturn = async () => {
    try {
      await fetch(`/api/devices/${id}/return`, { method: 'POST' });
      await fetchDevice();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !device) {
    return <ErrorAlert message={error || 'Device not found'} />;
  }

  const infoRows = [
    { label: 'Type', value: device.type },
    { label: 'Brand', value: device.brand },
    { label: 'Model', value: device.model },
    { label: 'Serial Number', value: device.serialNumber },
    { label: 'Asset Tag', value: device.assetTag || '-' },
    { label: 'Supplier', value: device.supplier || '-' },
    { label: 'Purchase Date', value: device.purchaseDate ? formatDate(device.purchaseDate) : '-' },
    { label: 'Purchase Price', value: device.purchasePrice ? formatCurrency(device.purchasePrice) : '-' },
    { label: 'Warranty Expiry', value: device.warrantyExpiry ? formatDate(device.warrantyExpiry) : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/devices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {device.name || `${device.brand} ${device.model}`}
          </h1>
          <StatusBadge type="device" value={device.status} />
        </div>
        <Link href={`/devices/${id}/edit`}>
          <Button variant="outline">
            <Edit className="h-4 w-4" /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Device info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {infoRows.map((r) => (
                <div key={r.label}>
                  <dt className="text-sm font-medium text-gray-500">{r.label}</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">{r.value}</dd>
                </div>
              ))}
            </dl>
            {device.notes && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{device.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {currentAssignee ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{currentAssignee.name}</p>
                    <p className="text-sm text-gray-500">{currentAssignee.email}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={handleReturn}>
                    <RotateCcw className="h-4 w-4" /> Return Device
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Not assigned</p>
                  <Button size="sm" className="w-full" onClick={() => setAssignDialogOpen(true)}>
                    <UserPlus className="h-4 w-4" /> Assign
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Assignment history */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assignment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Assigned</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Returned</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a._id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-900">{a.user?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(a.assignedDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{a.returnDate ? formatDate(a.returnDate) : '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge type="device" value={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Device</DialogTitle>
            <DialogClose onClose={() => setAssignDialogOpen(false)} />
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Select user</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedUserId || assigning}>
                {assigning ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
