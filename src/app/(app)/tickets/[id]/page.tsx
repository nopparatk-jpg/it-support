'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ErrorAlert } from '@/components/ui/error-alert';
import { formatDateTime } from '@/lib/utils';
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  ACTION_LABELS,
} from '@/lib/constants';
import type { TicketItem, UserItem, ActivityItem } from '@/lib/types';
import { ArrowLeft, Send, MessageSquare, Lock } from 'lucide-react';

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; email: string };
  type: 'public' | 'internal';
  createdAt: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isAgent } = useAuth();
  const [ticket, setTicket] = useState<TicketItem | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [agents, setAgents] = useState<UserItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'public' | 'internal'>('public');
  const [submitting, setSubmitting] = useState(false);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (!res.ok) throw new Error('Failed to load ticket');
      const data = await res.json();
      setTicket(data.ticket ?? data);
      setComments(data.comments ?? []);
      setActivity(data.activities ?? []);
    } catch {
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();

    if (isAgent) {
      fetch('/api/users?role=agent&role=admin')
        .then((r) => r.json())
        .then((d) => setAgents(d.users ?? []))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAgent]);

  const updateTicket = async (updates: Record<string, string>) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchTicket();
      }
    } catch {
      // silent
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment, type: commentType }),
      });
      if (res.ok) {
        setNewComment('');
        await fetchTicket();
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error || !ticket) {
    return <ErrorAlert message={error || 'Ticket not found'} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{ticket.ticketNumber}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ticket info */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-gray-900">{ticket.subject}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusBadge type="ticket" value={ticket.status} />
                <StatusBadge type="priority" value={ticket.priority} />
                {ticket.category && (
                  <Badge variant="secondary">{ticket.category.name}</Badge>
                )}
              </div>
              {ticket.description && (
                <div className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
                  {ticket.description}
                </div>
              )}
              {ticket.attachments?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-gray-500">Attachments</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((a, i) => (
                      <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-blue-600 hover:bg-gray-200"
                      >
                        {a.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                <span>Requester: <strong className="text-gray-700">{ticket.requester?.name}</strong></span>
                <span>Created: {formatDateTime(ticket.createdAt)}</span>
                <span>Updated: {formatDateTime(ticket.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No comments yet</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((c) => (
                    <div
                      key={c._id}
                      className={`rounded-lg border p-4 ${
                        c.type === 'internal'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                            {c.author?.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{c.author?.name}</span>
                          {c.type === 'internal' && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              <Lock className="mr-1 h-3 w-3" />
                              Internal
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="mt-6 space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
                <div className="flex items-center justify-between">
                  {isAgent && (
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Type:</Label>
                      <button
                        type="button"
                        onClick={() => setCommentType('public')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          commentType === 'public'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Public
                      </button>
                      <button
                        type="button"
                        onClick={() => setCommentType('internal')}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          commentType === 'internal'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        Internal Note
                      </button>
                    </div>
                  )}
                  <Button type="submit" size="sm" disabled={submitting}>
                    <Send className="h-4 w-4" />
                    {submitting ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          {activity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activity.map((a) => (
                    <div key={a._id} className="flex items-start gap-3 text-sm">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                      <div>
                        <p className="text-gray-700">
                          <span className="font-medium text-gray-900">
                            {a.actor?.name ?? 'System'}
                          </span>{' '}
                          {ACTION_LABELS[a.action] ?? a.action}
                        </p>
                        <p className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - actions */}
        {isAgent && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select
                    value={ticket.status}
                    onChange={(e) => updateTicket({ status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={ticket.priority}
                    onChange={(e) => updateTicket({ priority: e.target.value })}
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Assign To</Label>
                  <Select
                    value={ticket.assignedTo?._id ?? ''}
                    onChange={(e) => updateTicket({ assignedTo: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-medium text-gray-500">Requester</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{ticket.requester?.name}</p>
                <p className="text-sm text-gray-500">{ticket.requester?.email}</p>
                {ticket.requester?.department && (
                  <p className="text-sm text-gray-500">{ticket.requester.department}</p>
                )}
                {ticket.requester?.tel && (
                  <p className="text-sm text-gray-500">{ticket.requester.tel}</p>
                )}
              </CardContent>
            </Card>

            {ticket.assignedTo && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-500">Assigned Agent</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{ticket.assignedTo.name}</p>
                  <p className="text-sm text-gray-500">{ticket.assignedTo.email}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
