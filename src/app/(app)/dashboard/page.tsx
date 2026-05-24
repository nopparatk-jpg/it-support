'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/app-shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/error-alert';
import { formatDateTime } from '@/lib/utils';
import { ACTION_LABELS } from '@/lib/constants';
import type { TicketItem, ActivityItem } from '@/lib/types';
import {
  Ticket,
  Clock,
  Monitor,
  KeyRound,
  AlertCircle,
} from 'lucide-react';

interface ReportsData {
  ticketsByStatus: Record<string, number>;
  devicesByStatus: Record<string, number>;
  licensesByStatus: Record<string, number>;
  activeAssignmentsCount: number;
  unassignedTicketsCount: number;
}

interface Stats {
  openTickets: number;
  inProgressTickets: number;
  totalDevices: number;
  activeLicenses: number;
  unassignedTickets: number;
}

export default function DashboardPage() {
  const { user, isAgent, isRequester } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ticketsRes] = await Promise.all([
          fetch('/api/reports'),
          fetch(isRequester ? '/api/tickets?limit=5&mine=true' : '/api/tickets?limit=5'),
        ]);

        if (statsRes.ok) {
          const data: ReportsData = await statsRes.json();
          const totalDevices = Object.values(data.devicesByStatus ?? {}).reduce((a, b) => a + b, 0);
          const activeLicenses = (data.licensesByStatus ?? {})['active'] ?? 0;
          setStats({
            openTickets: (data.ticketsByStatus ?? {})['open'] ?? 0,
            inProgressTickets: (data.ticketsByStatus ?? {})['in_progress'] ?? 0,
            totalDevices,
            activeLicenses,
            unassignedTickets: data.unassignedTicketsCount ?? 0,
          });
        }

        if (ticketsRes.ok) {
          const data = await ticketsRes.json();
          setTickets(data.tickets ?? []);
        }

        if (isAgent) {
          const actRes = await fetch('/api/activity?limit=10');
          if (actRes.ok) {
            const data = await actRes.json();
            setActivity(data.activities ?? []);
          }
        }
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAgent, isRequester]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  const statCards = [
    {
      label: 'Open Tickets',
      value: stats?.openTickets ?? 0,
      icon: <Ticket className="h-5 w-5 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: 'In Progress',
      value: stats?.inProgressTickets ?? 0,
      icon: <Clock className="h-5 w-5 text-yellow-600" />,
      bg: 'bg-yellow-50',
    },
    {
      label: 'Total Devices',
      value: stats?.totalDevices ?? 0,
      icon: <Monitor className="h-5 w-5 text-green-600" />,
      bg: 'bg-green-50',
    },
    {
      label: 'Active Licenses',
      value: stats?.activeLicenses ?? 0,
      icon: <KeyRound className="h-5 w-5 text-purple-600" />,
      bg: 'bg-purple-50',
    },
    {
      label: 'Unassigned',
      value: stats?.unassignedTickets ?? 0,
      icon: <AlertCircle className="h-5 w-5 text-red-600" />,
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {isRequester ? 'My Dashboard' : 'Dashboard'}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isRequester ? 'My Open Tickets' : 'Recent Tickets'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                No tickets found
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <Link
                    key={t._id}
                    href={`/tickets/${t._id}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {t.subject}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.ticketNumber} &middot; {formatDateTime(t.createdAt)}
                      </p>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <StatusBadge type="priority" value={t.priority} />
                      <StatusBadge type="ticket" value={t.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Feed (agent/admin only) */}
        {isAgent && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {activity.map((a) => (
                    <div key={a._id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-gray-700">
                          <span className="font-medium text-gray-900">
                            {a.actor?.name ?? 'System'}
                          </span>{' '}
                          {ACTION_LABELS[a.action] ?? a.action}
                          {a.ticket && (
                            <>
                              {' '}
                              <Link
                                href={`/tickets/${a.ticket._id}`}
                                className="font-medium text-blue-600 hover:underline"
                              >
                                {a.ticket.ticketNumber}
                              </Link>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Requester: assigned devices */}
        {isRequester && (
          <Card>
            <CardHeader>
              <CardTitle>My Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href="/my-devices"
                className="inline-flex items-center text-sm text-blue-600 hover:underline"
              >
                View all my devices
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
