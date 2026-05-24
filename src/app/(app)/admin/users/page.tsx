'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Upload } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { StatusBadge } from '@/components/status-badge';
import type { UserItem } from '@/lib/types';

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editUser, setEditUser] = useState<UserItem | null>(null);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (search) params.set('search', search);
    fetch(`/api/users?${params}`)
      .then(r => r.json())
      .then(data => setUsers(data.users ?? []))
      .finally(() => setLoading(false));
  }, [role, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        password: fd.get('password'),
        role: fd.get('role'),
        employeeId: fd.get('employeeId'),
        department: fd.get('department'),
        position: fd.get('position'),
        tel: fd.get('tel'),
      }),
    });
    if (res.ok) { setShowCreate(false); fetchUsers(); }
    else { const d = await res.json(); setError(d.error); }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/users/${editUser._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        role: fd.get('role'),
        employeeId: fd.get('employeeId'),
        department: fd.get('department'),
        position: fd.get('position'),
        tel: fd.get('tel'),
        isActive: fd.get('isActive') === 'true',
      }),
    });
    if (res.ok) { setEditUser(null); fetchUsers(); }
    else { const d = await res.json(); setError(d.error); }
  }

  async function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/users/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: fd.get('csv') }) });
    if (res.ok) { setShowImport(false); fetchUsers(); }
    else { const d = await res.json(); setError(d.error); }
  }

  const roleBadgeColor: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    agent: 'bg-purple-100 text-purple-800',
    requester: 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"><Upload className="h-4 w-4" /> Import CSV</button>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add User</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-4">
          <select value={role} onChange={e => setRole(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="requester">Requester</option>
          </select>
          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="rounded-lg border border-gray-300 py-1.5 pl-9 pr-3 text-sm w-64" />
          </div>
        </div>

        {loading ? (
          <Spinner className="flex items-center justify-center py-12" />
        ) : users.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-gray-500">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Employee ID</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u._id} className="cursor-pointer hover:bg-gray-50" onClick={() => setEditUser(u)}>
                    <td className="px-4 py-3 text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{u.employeeId || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.department || '-'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${roleBadgeColor[u.role] || ''}`}>{u.role}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Add User</h2>
            {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Name *</label><input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Email *</label><input name="email" type="email" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Password *</label><input name="password" type="password" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                  <select name="role" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="requester">Requester</option><option value="agent">Agent</option><option value="admin">Admin</option></select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Employee ID</label><input name="employeeId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Department</label><input name="department" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Position</label><input name="position" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Tel</label><input name="tel" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Edit User</h2>
            {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Name *</label><input name="name" required defaultValue={editUser.name} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Email *</label><input name="email" type="email" required defaultValue={editUser.email} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                  <select name="role" defaultValue={editUser.role} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="requester">Requester</option><option value="agent">Agent</option><option value="admin">Admin</option></select>
                </div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select name="isActive" defaultValue={String(editUser.isActive)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value="true">Active</option><option value="false">Inactive</option></select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Employee ID</label><input name="employeeId" defaultValue={editUser.employeeId} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Department</label><input name="department" defaultValue={editUser.department} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Position</label><input name="position" defaultValue={editUser.position} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
                <div><label className="mb-1 block text-sm font-medium text-gray-700">Tel</label><input name="tel" defaultValue={editUser.tel} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setEditUser(null); setError(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Update User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Import Users (CSV)</h2>
            <p className="mb-3 text-sm text-gray-500">Columns: name, email, role, employeeId, department, position, tel</p>
            {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleImport} className="space-y-3">
              <textarea name="csv" rows={8} required placeholder="name,email,role,employeeId,department,position,tel&#10;John Doe,john@company.com,requester,EMP-005,HR,HR Staff,5001" className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setShowImport(false); setError(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Import</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
