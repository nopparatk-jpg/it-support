'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/status-badge';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { LicenseItem, UserItem } from '@/lib/types';

interface LicenseAssignmentItem {
  _id: string;
  user: { _id: string; name: string; email: string; employeeId?: string; department?: string };
  assignedDate: string;
  revokedDate?: string;
  status: 'active' | 'revoked';
  notes?: string;
}

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [license, setLicense] = useState<LicenseItem | null>(null);
  const [assignments, setAssignments] = useState<LicenseAssignmentItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchLicense = useCallback(async () => {
    try {
      const res = await fetch(`/api/licenses/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLicense(data.license);
      setAssignments(data.assignments ?? []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLicense();
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {});
  }, [fetchLicense]);

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this license?')) return;
    const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/licenses');
  }

  async function handleAssign() {
    if (!selectedUserId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/licenses/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (res.ok) {
        setAssignDialogOpen(false);
        setSelectedUserId('');
        await fetchLicense();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to assign');
      }
    } finally {
      setAssigning(false);
    }
  }

  async function handleRevoke(assignmentId: string) {
    if (!confirm('Revoke this license assignment?')) return;
    const res = await fetch(`/api/licenses/${id}/assign`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignmentId }),
    });
    if (res.ok) await fetchLicense();
  }

  if (loading) return <Spinner className="flex items-center justify-center py-12" />;
  if (!license) return <p className="py-12 text-center text-gray-500">License not found.</p>;

  const activeAssignments = assignments.filter((a) => a.status === 'active');
  const revokedAssignments = assignments.filter((a) => a.status === 'revoked');
  const availableSeats = license.totalSeats - license.usedSeats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/licenses" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{license.name}</h1>
          <StatusBadge type="license" value={license.status} />
        </div>
        <div className="flex gap-2">
          <Link href={`/licenses/${id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* License info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>License Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Vendor</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{license.vendor}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-0.5 text-sm capitalize text-gray-900">{license.type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">License Key</dt>
                <dd className="mt-0.5 font-mono text-sm text-gray-900">{license.licenseKey}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Seats</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {license.usedSeats} / {license.totalSeats} used
                  <span className="ml-2 text-gray-500">({availableSeats} available)</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Purchase Date</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{license.purchaseDate ? formatDate(license.purchaseDate) : '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Expiry Date</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{license.expiryDate ? formatDate(license.expiryDate) : '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Cost</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{license.cost ? formatCurrency(license.cost) : '-'}</dd>
              </div>
            </dl>
            {license.notes && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{license.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active assignments sidebar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Assigned Users</CardTitle>
            {availableSeats > 0 && (
              <Button size="sm" onClick={() => setAssignDialogOpen(true)}>
                <UserPlus className="h-4 w-4" /> Assign
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {activeAssignments.length === 0 ? (
              <p className="text-sm text-gray-500">No users assigned</p>
            ) : (
              <ul className="space-y-3">
                {activeAssignments.map((a) => (
                  <li key={a._id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.user.name}</p>
                      <p className="text-xs text-gray-500">{a.user.email}</p>
                    </div>
                    <button
                      onClick={() => handleRevoke(a._id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Revoke"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
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
                    <th className="px-4 py-3 font-medium text-gray-500">Revoked</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a._id} className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <p className="text-gray-900">{a.user.name}</p>
                        <p className="text-xs text-gray-500">{a.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(a.assignedDate)}</td>
                      <td className="px-4 py-3 text-gray-600">{a.revokedDate ? formatDate(a.revokedDate) : '-'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge type="assignment" value={a.status} />
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
            <DialogTitle>Assign License</DialogTitle>
            <DialogClose onClose={() => setAssignDialogOpen(false)} />
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              <option value="">Select user</option>
              {users
                .filter((u) => !activeAssignments.some((a) => a.user._id === u._id))
                .map((u) => (
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
