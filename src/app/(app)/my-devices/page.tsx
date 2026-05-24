'use client';

import { useEffect, useState } from 'react';
import { Laptop, Monitor, Smartphone, Printer, Keyboard } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import type { AssignmentItem } from '@/lib/types';

const deviceIcons: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="h-6 w-6 text-blue-600" />,
  Monitor: <Monitor className="h-6 w-6 text-blue-600" />,
  Phone: <Smartphone className="h-6 w-6 text-blue-600" />,
  Printer: <Printer className="h-6 w-6 text-blue-600" />,
  Keyboard: <Keyboard className="h-6 w-6 text-blue-600" />,
};

export default function MyDevicesPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/my-devices')
      .then(r => r.json())
      .then(data => setAssignments(data.assignments ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner className="flex items-center justify-center py-12" />;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Devices</h1>

      {assignments.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">No devices assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map(a => {
            const d = a.device;
            return (
              <div key={a._id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    {deviceIcons[d.type] ?? <Laptop className="h-6 w-6 text-blue-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{d.name || `${d.brand} ${d.model}`}</p>
                    <p className="text-sm text-gray-500">S/N: {d.serialNumber}</p>
                    <p className="text-sm text-gray-500">{d.type}</p>
                    <p className="mt-1 text-xs text-gray-400">Assigned: {formatDate(a.assignedDate)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
