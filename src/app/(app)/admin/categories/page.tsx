'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import type { CategoryItem } from '@/lib/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = useCallback(() => {
    setLoading(true);
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data.categories ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim() }) });
    if (res.ok) { setNewName(''); fetchCategories(); }
    else { const d = await res.json(); setError(d.error); }
  }

  async function toggleActive(cat: CategoryItem) {
    await fetch(`/api/categories/${cat._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !cat.isActive }),
    });
    fetchCategories();
  }

  if (loading) return <Spinner className="flex items-center justify-center py-12" />;

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Ticket Categories</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <form onSubmit={handleCreate} className="mb-6 flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New category name..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Add</button>
        </form>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div className="space-y-2">
          {categories.map(cat => (
            <div key={cat._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <span className="text-sm text-gray-900">{cat.name}</span>
              <button onClick={() => toggleActive(cat)} className={`rounded-full px-2 py-1 text-xs font-medium ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {cat.isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
