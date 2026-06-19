export interface Attachment {
  name: string;
  url: string;
  size: number;
}

export interface CategoryItem {
  _id: string;
  name: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface ActivityItem {
  _id: string;
  action: string;
  actor?: { _id?: string; name: string; email: string };
  ticket?: { _id: string; ticketNumber: string; subject: string };
  targetUser?: { _id?: string; name: string; email: string };
  device?: { _id: string; name: string; brand: string; model: string };
  license?: { _id: string; name: string };
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TicketItem {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: CategoryItem | null;
  requester: {
    _id: string;
    name: string;
    email: string;
    employeeId?: string;
    department?: string;
    tel?: string;
  };
  assignedTo: { _id: string; name: string; email: string } | null;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceItem {
  _id: string;
  name?: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  supplier?: string;
  assetTag?: string;
  photos?: { name: string; url: string }[];
  notes?: string;
  assignedTo?: { _id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface LicenseItem {
  _id: string;
  name: string;
  licenseKey: string;
  type: string;
  vendor: string;
  totalSeats: number;
  usedSeats: number;
  purchaseDate?: string;
  expiryDate?: string;
  cost?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentItem {
  _id: string;
  device: DeviceItem;
  user: { _id: string; name: string; email: string; employeeId?: string; department?: string };
  assignedDate: string;
  returnDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  department: string;
  position: string;
  tel: string;
  isActive: boolean;
  createdAt: string;
}
