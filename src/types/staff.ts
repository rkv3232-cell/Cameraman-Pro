// Staff Management Types

export type StaffRole = 'lead_photographer' | 'second_shooter' | 'editor' | 'drone_operator' | 'assistant' | 'freelancer';

export type StaffStatus = 'active' | 'busy' | 'on_event' | 'offline' | 'suspended';

export interface StaffMember {
  id: string;
  employeeId: string;       // Auto-generated: CP-1001
  fullName: string;
  email?: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  profilePhoto?: string;    // Firebase Storage URL

  // Personal Info
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  emergencyContact?: string;
  emergencyPhone?: string;

  // Professional Info
  joiningDate: string;      // ISO date string
  experience?: string;      // e.g. "3 years"
  skills?: string[];
  branch?: string;
  notes?: string;           // internal only

  // System Fields
  studioId: string;
  idCardEnabled: boolean;
  isVerified: boolean;
  qrUrl?: string;

  // Stats (auto-computed)
  totalEvents?: number;
  lastEventDate?: string;
  rating?: number;

  createdAt: any;
  updatedAt?: any;
  createdBy?: string;
}

export interface StaffEvent {
  id: string;
  staffId: string;
  studioId: string;
  eventName: string;
  eventType: 'wedding' | 'corporate' | 'portrait' | 'commercial' | 'product' | 'event' | 'other';
  clientName: string;
  eventDate: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  role?: string;            // role in this event
  rating?: number;
  notes?: string;
  deliveryStatus?: 'pending' | 'in_progress' | 'delivered';
  createdAt: any;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  studioId: string;
  date: string;             // ISO date
  checkIn?: string;         // ISO datetime
  checkOut?: string;
  eventId?: string;
  status: 'present' | 'absent' | 'half_day' | 'on_leave';
  notes?: string;
  createdAt: any;
}

export interface StaffNotification {
  id: string;
  staffId: string;
  studioId: string;
  title: string;
  message: string;
  type: 'event_assigned' | 'id_approved' | 'suspended' | 'attendance' | 'general';
  isRead: boolean;
  createdAt: any;
}
