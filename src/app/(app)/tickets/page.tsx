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
import { STATUS_OPTIONS, PRIORITY_OPTIONS, STATUS_LABELS, PRIORITY_LABELS } from '@/lib/constants';
import type { TicketItem, CategoryItem } from '@/lib/types';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      if (category) params.set('category', category);
      if (search) params.set('search', search);

      const res = await fetch(`/api/tickets?${params}`);
      if (!res.ok) throw new Error('Failed to load tickets');
      const data = await res.json();
      setTickets(data.tickets ?? []);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch {
      setError('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, status, priority, category, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <Link href="/tickets/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-3 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 md:flex md:gap-3">
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </Select>
            <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
              ))}
            </Select>
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {error && <ErrorAlert message={error} />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      ) : tickets.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">No tickets found</p>
      ) : (
        <Card className="overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Ticket #</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Subject</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Requester</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Priority</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => router.push(`/tickets/${t._id}`)}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">{t.ticketNumber}</td>
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{t.subject}</td>
                    <td className="px-4 py-3 text-gray-600">{t.requester?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge type="priority" value={t.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="ticket" value={t.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden divide-y divide-gray-100">
            {tickets.map((t) => (
              <div
                key={t._id}
                onClick={() => router.push(`/tickets/${t._id}`)}
                className="flex flex-col gap-2 px-4 py-3 active:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600">{t.ticketNumber}</span>
                  <span className="text-xs text-gray-400">{formatDate(t.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{t.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.requester?.name ?? '-'}</span>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge type="priority" value={t.priority} />
                    <StatusBadge type="ticket" value={t.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
