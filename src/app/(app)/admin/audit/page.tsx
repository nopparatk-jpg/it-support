'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import { ACTION_LABELS } from '@/lib/constants';
import type { ActivityItem } from '@/lib/types';

const dotColors: Record<string, string> = {
  ticket_created: 'bg-blue-500',
  ticket_updated: 'bg-blue-400',
  ticket_status_changed: 'bg-yellow-500',
  ticket_assigned: 'bg-purple-500',
  comment_added: 'bg-green-500',
  internal_note_added: 'bg-green-400',
  device_created: 'bg-teal-500',
  device_updated: 'bg-teal-400',
  device_assigned: 'bg-indigo-500',
  device_returned: 'bg-orange-500',
  license_created: 'bg-pink-500',
  license_updated: 'bg-pink-400',
  user_created: 'bg-violet-500',
  login: 'bg-gray-400',
  logout: 'bg-gray-300',
};

function activityDescription(a: ActivityItem): string {
  const label = ACTION_LABELS[a.action] || a.action;
  const parts = [label];
  if (a.ticket) parts.push(`${a.ticket.ticketNumber}`);
  if (a.device) parts.push(`${a.device.name || `${a.device.brand} ${a.device.model}`}`);
  if (a.license) parts.push(`${a.license.name}`);
  if (a.targetUser) parts.push(`→ ${a.targetUser.name}`);
  return parts.join(' ');
}

export default function AuditPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/activity?page=${page}&limit=${limit}`)
      .then(r => r.json())
      .then(data => {
        setActivities(data.activities ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Audit Log</h1>

      <div className="rounded-lg border border-gray-200 bg-white">
        {loading ? (
          <Spinner className="flex items-center justify-center py-12" />
        ) : activities.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">No activity recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {activities.map(a => (
              <div key={a._id} className="flex items-start gap-3 px-4 py-3">
                <div className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dotColors[a.action] || 'bg-gray-400'}`} />
                <div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{a.actor?.name || 'System'}</span>{' '}
                    {activityDescription(a)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDateTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <span className="text-sm text-gray-500">Page {page} of {Math.ceil(total / limit)}</span>
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
