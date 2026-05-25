import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type StatusType = 'ticket' | 'priority' | 'device' | 'license' | 'assignment';

const statusColorMap: Record<StatusType, Record<string, string>> = {
  ticket: {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    waiting: 'bg-orange-100 text-orange-800 border-orange-200',
    resolved: 'bg-green-100 text-green-800 border-green-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  priority: {
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    medium: 'bg-blue-100 text-blue-800 border-blue-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  },
  device: {
    available: 'bg-green-100 text-green-800 border-green-200',
    assigned: 'bg-blue-100 text-blue-800 border-blue-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    retired: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  license: {
    active: 'bg-green-100 text-green-800 border-green-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  assignment: {
    active: 'bg-green-100 text-green-800 border-green-200',
    returned: 'bg-gray-100 text-gray-800 border-gray-200',
    revoked: 'bg-red-100 text-red-800 border-red-200',
  },
};

const labelMap: Record<string, string> = {
  in_progress: 'In Progress',
};

export interface StatusBadgeProps {
  type: StatusType;
  value: string;
  className?: string;
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  const colors = statusColorMap[type]?.[value] || 'bg-gray-100 text-gray-800 border-gray-200';
  const label = labelMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

  return (
    <Badge className={cn(colors, className)}>
      {label}
    </Badge>
  );
}
