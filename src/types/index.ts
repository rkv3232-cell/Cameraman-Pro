import { Timestamp } from 'firebase/firestore';

// ─── SHOOT TIMELINE ENTRY ───────────────────────────────────────
export interface ShootTimelineEntry {
    id: string;    // nanoid / Date.now()
    time: string;    // "HH:mm" 24-hr format
    label: string;    // e.g. "Ceremony Start"
    notes?: string;    // optional detail
    icon?: string;    // emoji or preset key e.g. "arrival"
    order: number;    // sort index
}

// ─── CONTRACT FILE META (stored in Firestore, actual file in Firebase Storage) ─
export interface ContractFileMeta {
    name: string;
    url: string;
    storagePath: string;
    type: 'pdf' | 'image' | 'other';
    uploadedAt: string;   // ISO string
    sizeKb: number;
}

// ─── ENQUIRY (LEAD PIPELINE) ────────────────────────────────────
export type EnquiryStatus = 'new' | 'contacted' | 'converted' | 'closed';

export interface Enquiry {
    id: string;
    studioId?: string; // Optional for public default
    name: string;
    phone: string;
    email?: string;
    eventType: string; // e.g. "Wedding", "Pre-wedding"
    date: string;      // ISO string "YYYY-MM-DD"
    location: string;
    message: string;
    source?: string;
    status: EnquiryStatus;
    createdAt: Timestamp;
}

export type GalleryCategory = 'Wedding' | 'Pre-Wedding' | 'Drone' | 'Cinematic';

export interface GalleryImage {
    id: string; // publicId
    publicId: string;
    imageUrl: string;
    title: string;
    category: GalleryCategory;
    createdAt: number; // Cloudinary returns timestamp
}

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    photoURL?: string;
    studioId: string;
    personalWorkspaceId?: string;
    activeWorkspaceId?: string;
    role: 'owner' | 'admin' | 'manager' | 'member' | 'accountant' | 'coordinator' | 'client';
    createdAt: Timestamp;
}

// Studio Entity
export interface Studio {
    id: string;
    name: string;
    ownerId: string;
    studioCode?: string; // Same as doc ID, stored for reference
    createdAt: Timestamp;
    settings: {
        currency: 'INR';
        timezone?: string;
        businessHours?: { start: string; end: string };
    };
}

// ─── TEAM SYSTEM ────────────────────────────────────
export type TeamRole = 'owner' | 'admin' | 'manager' | 'member' | 'accountant' | 'coordinator';
export type MemberStatus = 'active' | 'removed';

export interface TeamMember {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    photoURL?: string;
    role: TeamRole;
    status: MemberStatus;
    joinedAt: Timestamp;
    addedBy?: string;
}

// ─── TEAM ASSIGNMENT (per booking) ──────────────────
export interface BookingTeamMember {
    uid: string;
    name: string;
    role: 'lead_photographer' | 'second_shooter' | 'editor' | 'drone_operator' | 'assistant' | 'freelancer';
}

export interface TeamAssignment {
    mainPhotographer?: BookingTeamMember | null;
    droneOperator?: BookingTeamMember | null;
    editor?: BookingTeamMember | null;
    assistants?: BookingTeamMember[];
}

export interface StudioDetails {
    id: string;
    name: string;
    ownerId: string;
    studioCode: string;
    memberCount: number;
    createdAt: Timestamp;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'deleted';
export type ShootStatus = 'upcoming' | 'completed';
export type EventType = 'wedding' | 'pre-wedding' | 'birthday' | 'corporate' | 'other';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque';
export type EquipmentCategory = 'camera' | 'lens' | 'lighting' | 'tripod' | 'accessory' | 'drone';
export type EquipmentStatus = 'available' | 'booked' | 'maintenance' | 'in_service' | 'damaged' | 'deleted';

// Sub-Event for Multi-Event Bookings
export interface SubEvent {
    id: string;
    title: string; // e.g., "Haldi", "Wedding", "Reception"
    date: string; // ISO date string
    time: string; // Time string (e.g., "10:00 AM")
}

export interface FinancialRecord {
    totalAmount: number; // Stored in paise (integer)
    advancePaid: number; // Stored in paise (integer)
    balanceDue: number; // Computed in UI usually, but can be stored for indexing
    paymentHistory: PaymentTransaction[];
}

export interface PaymentTransaction {
    id: string;
    amount: number; // paise
    method: PaymentMethod;
    date: Timestamp;
    notes?: string;
    referenceId?: string; // UPI Ref No., Cheque No., etc.
}

export interface BookedEquipmentItem {
    itemId: string;
    name: string;
    serialNumber?: string;
    qty: number;
    rentalRate: number; // paise
}

export interface ClientPortalImage {
    id: string;
    url: string;
    isSelected: boolean;
}

export interface BookingClientPortal {
    status: 'inactive' | 'active' | 'selections_submitted' | 'album_ready';
    pin?: string;
    galleryLink?: string;          // External link to full gallery (Drive, Cloudinary)
    paymentLink?: string;          // UPI or Razorpay specific link
    selectionImages?: ClientPortalImage[]; // Array for photo selection
    selectedCount?: number;
    lastAccessedAt?: Timestamp;
}

export interface Booking {
    id: string;
    clientPortal?: BookingClientPortal;
    // studioId is implicit in subcollection path but useful to keep for collection group queries
    studioId: string;

    // Client Info
    clientName: string;
    clientPhone: string;
    clientAddress?: string;
    clientEmail?: string;

    // Event Info
    eventType: EventType; // Kept for backward compatibility
    eventDate: Timestamp; // Kept for backward compatibility - will show first event date
    venue: string;

    // Multi-Event System (NEW)
    subEvents?: SubEvent[]; // Array of sub-events for multi-event bookings

    // Resources
    equipmentBooked: BookedEquipmentItem[];

    // Financials
    financials: FinancialRecord;

    // Post-Production
    postProductionStatus?: {
        dataBackup: boolean;
        photoEditing: boolean;
        videoMixing: boolean;
        albumSent: boolean;
        progress: number; // 0-100, auto-calculated
        // Optional: who completed each task
        dataBackupBy?: string;
        photoEditingBy?: string;
        videoMixingBy?: string;
        albumSentBy?: string;
        completedAt?: string; // ISO when all 4 done
    };

    // Team Assignment
    teamAssignment?: TeamAssignment;

    // Contracts & Documents (stored in Firebase Storage, metadata here)
    contracts?: ContractFileMeta[];

    // Shoot Day Timeline
    shootTimeline?: ShootTimelineEntry[];

    // Shoot Status (Upcoming / Completed)
    shootStatus?: ShootStatus;
    completedAt?: Timestamp | null;

    // Meta
    status: BookingStatus;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
    createdByName?: string;
}

export interface InventoryItem {
    id: string;
    studioId: string;
    name: string;
    category: EquipmentCategory;
    status: EquipmentStatus;
    serialNumber?: string;
    purchaseDate?: Timestamp;
    condition?: 'new' | 'good' | 'fair' | 'poor';
    dailyRentalRate: number; // paise
    notes?: string;
    currentBookingId?: string | null;
}

export interface TrashItem {
    id: string;
    originalCollection: 'bookings' | 'equipment' | 'clients';
    originalId: string;
    studioId?: string; // Added for root collection filtering
    data: any;
    deletedBy: string;
    deletedAt: Timestamp;
    expiresAt: Timestamp;
}

// ─── EXPENSE TRACKING ───────────────────────────────
export type ExpenseCategory = 'fuel' | 'assistant_payment' | 'repair_maintenance' | 'miscellaneous';

export interface Expense {
    id: string;
    studioId: string;
    amount: number; // Stored in paise (integer)
    category: ExpenseCategory;
    date: Timestamp;
    linkedBookingId?: string | null;
    linkedBookingName?: string; // Denormalized for display
    notes?: string;
    createdBy: string;
    createdByName?: string;
    createdAt: Timestamp;
}

// ─── REPORTS ────────────────────────────────────────
export interface ReportData {
    period: 'daily' | 'weekly';
    startDate: Date;
    endDate: Date;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;       // paise
    totalExpenses: number;      // paise
    netProfit: number;          // paise
    pendingPayments: number;    // paise
    expenseBreakdown: Record<ExpenseCategory, number>;
    topClients: { name: string; revenue: number }[];
}

// ─── PREDICTIVE ALERTS ──────────────────────────────
export interface PredictiveAlert {
    id: string;
    type: 'workload' | 'equipment_shortage' | 'editor_overload' | 'profit_drop' | 'high_expense';
    severity: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    suggestedActions: string[];
    timestamp: Date;
    data?: any;
}

// ─── SEARCH RESULT ──────────────────────────────────
export interface SearchResult {
    id: string;
    type: 'booking' | 'client' | 'equipment' | 'expense';
    title: string;
    subtitle: string;
    path: string;
    icon?: string;
}

// ─── PHOTO SESSION SYSTEM ────────────────────────────────────────────────────

export type SelectionType = 'favorite' | 'album' | 'priority' | 'rejected' | 'download';

export type SessionStatus = 'draft' | 'active' | 'locked' | 'delivered';

export interface WatermarkConfig {
    enabled: boolean;
    text: string;           // Studio name
    logoUrl?: string;       // Cloudinary logo public_id
    opacity: number;        // 0–100
    position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right';
}

export interface SelectionDeadline {
    bookingId: string;
    studioId: string;
    deadlineAt: Timestamp;         // When selection closes
    reminders: string[];           // ISO strings for scheduled reminder times
    autoLock: boolean;             // Lock session when deadline passes
    createdAt: Timestamp;
}

export interface PhotoSession {
    id: string;
    studioId: string;
    bookingId: string;
    clientName: string;
    eventType: string;
    eventDate: Timestamp;
    status: SessionStatus;
    accessCode: string;            // e.g. "WED-X7K2" — used for /select/:accessCode
    totalPhotos: number;
    maxSelections?: number;        // Optional cap
    watermark?: WatermarkConfig;
    deadlineAt?: Timestamp;
    isLocked: boolean;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    createdBy: string;
}

export interface SessionPhoto {
    id: string;
    sessionId: string;
    studioId: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    thumbnailUrl: string;          // Cloudinary w_400 transformation
    order: number;
    familyGroup?: string;          // Optional group id
    tags?: string[];               // Cloudinary AI tags
    aiScore?: number;              // 0–100 from BestShotDetector
    isDuplicate?: boolean;
    uploadedAt: Timestamp;
}

export interface PhotoSelection {
    id: string;                    // clientId or accessCode-based key
    sessionId: string;
    studioId: string;
    accessCode: string;
    clientLabel?: string;          // "Bride's Mom", etc.
    selections: Record<string, SelectionType | null>; // photoId → type
    totalSelected: number;
    submittedAt?: Timestamp;
    isSubmitted: boolean;
    updatedAt: Timestamp;
}

export interface FamilyGroup {
    id: string;
    sessionId: string;
    studioId: string;
    name: string;                  // e.g. "Bride Side", "Groom Side"
    color: string;                 // hex for UI badge
    photoIds: string[];
    order: number;
}

// ─── EDITOR & ALBUM WORKFLOW ──────────────────────────────────────────────────

export type EditorTaskStatus =
    | 'pending_edit'
    | 'color_grading'
    | 'album_design'
    | 'export_complete';

export interface EditorTask {
    id: string;
    studioId: string;
    sessionId: string;
    bookingId: string;
    clientName: string;
    status: EditorTaskStatus;
    assignedTo?: string;           // TeamMember uid
    assignedName?: string;
    totalSelected: number;
    notes?: string;
    dueDate?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type AlbumStage =
    | 'selection_pending'
    | 'album_designing'
    | 'client_approval'
    | 'printing'
    | 'delivery';

export interface AlbumQueueItem {
    id: string;
    studioId: string;
    sessionId: string;
    bookingId: string;
    clientName: string;
    stage: AlbumStage;
    designerUid?: string;
    designerName?: string;
    albumPages?: number;
    albumSize?: string;            // e.g. "12x36"
    printVendor?: string;
    notes?: string;
    approvedAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type DeliveryMode = 'digital' | 'pendrive' | 'album' | 'courier';
export type DeliveryStatus = 'preparing' | 'shipped' | 'delivered';

export interface DeliveryRecord {
    id: string;
    studioId: string;
    bookingId: string;
    sessionId?: string;
    clientName: string;
    clientPhone: string;
    mode: DeliveryMode;
    status: DeliveryStatus;
    trackingCode?: string;         // Courier tracking number
    courierPartner?: string;       // e.g. "DTDC", "BlueDart"
    address?: string;
    shippedAt?: Timestamp;
    deliveredAt?: Timestamp;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}
