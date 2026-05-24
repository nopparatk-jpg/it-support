export const STATUS_OPTIONS = ['open', 'in_progress', 'waiting', 'resolved', 'closed'] as const;
export const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;

export const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const DEVICE_STATUS_OPTIONS = ['available', 'assigned', 'maintenance', 'retired'] as const;

export const DEVICE_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  assigned: 'Assigned',
  maintenance: 'Maintenance',
  retired: 'Retired',
};

export const LICENSE_STATUS_OPTIONS = ['active', 'expired', 'cancelled'] as const;
export const LICENSE_TYPE_OPTIONS = ['per-seat', 'per-device', 'site', 'subscription'] as const;

export const ACTION_LABELS: Record<string, string> = {
  'ticket.create': 'Created ticket',
  'ticket.update': 'Updated ticket',
  'ticket.status': 'Changed ticket status',
  'ticket.assign': 'Assigned ticket',
  'ticket.comment': 'Added comment',
  'ticket.internal_note': 'Added internal note',
  'user.create': 'Created user',
  'user.update': 'Updated user',
  'user.import': 'Imported users',
  'device.create': 'Created device',
  'device.update': 'Updated device',
  'device.delete': 'Deleted device',
  'device.import': 'Imported devices',
  'assignment.create': 'Assigned device',
  'assignment.return': 'Returned device',
  'license.create': 'Created license',
  'license.update': 'Updated license',
  'license.import': 'Imported licenses',
  'license.delete': 'Deleted license',
  'category.create': 'Created category',
  'category.update': 'Updated category',
  'login': 'Logged in',
  'logout': 'Logged out',
};
