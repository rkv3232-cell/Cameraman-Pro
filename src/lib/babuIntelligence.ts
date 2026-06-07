import { Booking, InventoryItem } from '../types';
import { isToday, isTomorrow } from 'date-fns';
import { toSafeDate, safeFormat } from '../utils/date';

/**
 * Action types that BĀBU can suggest
 */
export interface BabuAction {
    type: 'navigate' | 'whatsapp' | 'call' | 'update' | 'create';
    label: string;
    icon?: string;
    data?: any;
    style?: 'primary' | 'secondary' | 'danger' | 'success';
}

/**
 * Enhanced context for BĀBU with intelligence
 */
export interface BabuContext {
    bookings: Booking[];
    inventory: InventoryItem[];
    currentDate: Date;
    userName?: string;
    userRole?: string;
}

/**
 * Finds bookings by fuzzy date matching
 */
export function findBookingsByDate(bookings: Booking[], dateQuery: string): Booking[] {
    const queryLower = dateQuery.toLowerCase();

    // Handle relative dates
    if (queryLower.includes('आज') || queryLower.includes('today')) {
        return bookings.filter(b => {
            const date = toSafeDate(b.eventDate);
            return isToday(date);
        });
    }

    if (queryLower.includes('कल') || queryLower.includes('kal') || queryLower.includes('tomorrow')) {
        return bookings.filter(b => {
            const date = toSafeDate(b.eventDate);
            return isTomorrow(date);
        });
    }

    // Try to parse date in various formats
    const datePatterns = [
        /(\d{1,2})\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
        /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/,
        /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i
    ];

    for (const pattern of datePatterns) {
        const match = dateQuery.match(pattern);
        if (match) {
            return bookings.filter(b => {
                const bookingDate = toSafeDate(b.eventDate);
                const dateStr = safeFormat(bookingDate, 'dd MMM').toLowerCase();
                return dateStr.includes(match[0].toLowerCase());
            });
        }
    }

    return [];
}

/**
 * Finds bookings by client name (fuzzy match)
 */
export function findBookingsByClient(bookings: Booking[], clientQuery: string): Booking[] {
    const queryLower = clientQuery.toLowerCase().trim();
    return bookings.filter(b =>
        b.clientName.toLowerCase().includes(queryLower)
    );
}

/**
 * Finds bookings with pending payments above threshold
 */
export function findBookingsWithPendingPayment(bookings: Booking[], minAmount: number = 0): Booking[] {
    return bookings.filter(b => {
        const due = b.financials.balanceDue || 0;
        return due > minAmount;
    }).sort((a, b) => b.financials.balanceDue - a.financials.balanceDue);
}

/**
 * Detects equipment conflicts (same item assigned to multiple bookings on same date)
 */
export function detectEquipmentConflicts(bookings: Booking[]): Array<{
    equipmentName: string;
    date: Date;
    conflictingBookings: Booking[];
}> {
    const conflicts: Map<string, { date: Date; bookings: Booking[]; name: string }> = new Map();

    // Group bookings by date
    const bookingsByDate: Map<string, Booking[]> = new Map();

    bookings.forEach(booking => {
        if (booking.status === 'cancelled' || booking.status === 'deleted') return;

        const date = toSafeDate(booking.eventDate);
        const dateKey = safeFormat(date, 'yyyy-MM-dd');

        if (!bookingsByDate.has(dateKey)) {
            bookingsByDate.set(dateKey, []);
        }
        bookingsByDate.get(dateKey)!.push(booking);
    });

    // Check for equipment overlaps on same date
    bookingsByDate.forEach((dayBookings, dateKey) => {
        if (dayBookings.length < 2) return;

        const equipmentMap: Map<string, { bookings: Booking[]; name: string }> = new Map();

        dayBookings.forEach(booking => {
            booking.equipmentBooked?.forEach(item => {
                const key = `${item.itemId}-${dateKey}`;
                if (!equipmentMap.has(key)) {
                    equipmentMap.set(key, { bookings: [], name: item.name });
                }
                equipmentMap.get(key)!.bookings.push(booking);
            });
        });

        equipmentMap.forEach((data, key) => {
            if (data.bookings.length > 1) {
                const dateObj = new Date(dateKey);
                conflicts.set(key, {
                    date: dateObj,
                    bookings: data.bookings,
                    name: data.name
                });
            }
        });
    });

    return Array.from(conflicts.values()).map(conflict => ({
        equipmentName: conflict.name,
        date: conflict.date,
        conflictingBookings: conflict.bookings
    }));
}

/**
 * Gets bookings with pending post-production work
 */
export function getPendingPostProduction(bookings: Booking[]): Array<{
    booking: Booking;
    pendingTasks: string[];
    progress: number;
}> {
    return bookings
        .filter(b => b.status === 'completed' || b.status === 'confirmed')
        .map(b => {
            const status = b.postProductionStatus;
            const pendingTasks: string[] = [];

            if (!status?.dataBackup) pendingTasks.push('डेटा बैकअप');
            if (!status?.photoEditing) pendingTasks.push('फोटो एडिटिंग');
            if (!status?.videoMixing) pendingTasks.push('वीडियो मिक्सिंग');
            if (!status?.albumSent) pendingTasks.push('एल्बम डिलीवरी');

            return {
                booking: b,
                pendingTasks,
                progress: status?.progress || 0
            };
        })
        .filter(item => item.pendingTasks.length > 0);
}

/**
 * Generates daily studio brief
 */
export function generateDailyBrief(context: BabuContext): {
    greeting: string;
    todayShots: number;
    pendingPayments: { count: number; total: number };
    urgentTasks: string[];
    actions: BabuAction[];
} {
    const hour = new Date().getHours();
    let greeting = 'नमस्ते';
    if (hour < 12) greeting = 'सुप्रभात';
    else if (hour < 17) greeting = 'नमस्ते';
    else greeting = 'शुभ संध्या';

    const userName = context.userName || 'बॉस';

    // Today's shoots
    const todayShots = context.bookings.filter(b => {
        const date = toSafeDate(b.eventDate);
        return isToday(date) && (b.status === 'confirmed' || b.status === 'pending');
    });

    // Pending payments
    const pendingPaymentBookings = findBookingsWithPendingPayment(context.bookings);
    const totalPending = pendingPaymentBookings.reduce((sum, b) => sum + b.financials.balanceDue, 0);

    // Urgent tasks
    const urgentTasks: string[] = [];
    const tomorrowShots = context.bookings.filter(b => {
        const date = toSafeDate(b.eventDate);
        return isTomorrow(date);
    });

    if (tomorrowShots.length > 0) {
        urgentTasks.push(`${tomorrowShots.length} कल के शूट्स तैयार करें`);
    }

    const conflicts = detectEquipmentConflicts(context.bookings);
    if (conflicts.length > 0) {
        urgentTasks.push(`${conflicts.length} उपकरण टकराव ठीक करें`);
    }

    return {
        greeting: `${greeting} ${userName} 👋`,
        todayShots: todayShots.length,
        pendingPayments: {
            count: pendingPaymentBookings.length,
            total: totalPending
        },
        urgentTasks,
        actions: [
            {
                type: 'navigate',
                label: '📅 आज का शेड्यूल',
                data: { page: '/calendar' },
                style: 'primary'
            },
            {
                type: 'navigate',
                label: '💰 बकाया भुगतान',
                data: { page: '/bookings' },
                style: 'secondary'
            }
        ]
    };
}

/**
 * Analyzes client history and reliability
 */
export function analyzeClientHistory(bookings: Booking[], clientName: string): {
    totalBookings: number;
    totalRevenue: number;
    averageDelay: number;
    reliabilityScore: number;
    summary: string;
} {
    const clientBookings = findBookingsByClient(bookings, clientName);

    if (clientBookings.length === 0) {
        return {
            totalBookings: 0,
            totalRevenue: 0,
            averageDelay: 0,
            reliabilityScore: 0,
            summary: `${clientName} का कोई रिकॉर्ड नहीं मिला।`
        };
    }

    const totalRevenue = clientBookings.reduce((sum, b) =>
        sum + (b.financials.totalAmount || 0), 0
    ) / 100;

    // Calculate payment delays (simplified)
    const completedBookings = clientBookings.filter(b =>
        b.status === 'completed' && b.financials.balanceDue === 0
    );

    const reliabilityScore = completedBookings.length / clientBookings.length * 100;

    let summary = `${clientName} ने ${clientBookings.length} बुकिंग करवाई हैं, `;
    summary += `कुल ₹${Math.floor(totalRevenue).toLocaleString('en-IN')} कमाई।\n`;

    if (reliabilityScore > 80) {
        summary += '✅ बहुत भरोसेमंद क्लाइंट है।';
    } else if (reliabilityScore > 50) {
        summary += '⚠️ कभी-कभी भुगतान में देरी करता है।';
    } else {
        summary += '🚨 भुगतान का रिकॉर्ड कमजोर है।';
    }

    return {
        totalBookings: clientBookings.length,
        totalRevenue,
        averageDelay: 0,
        reliabilityScore,
        summary
    };
}

/**
 * Generates action buttons for a booking
 */
export function generateBookingActions(booking: Booking): BabuAction[] {
    return [
        {
            type: 'navigate',
            label: '📄 Booking खोलें',
            data: { page: `/bookings/${booking.id}` },
            style: 'primary'
        },
        {
            type: 'whatsapp',
            label: '💬 WhatsApp भेजें',
            data: {
                phone: booking.clientPhone,
                message: `नमस्ते ${booking.clientName} जी,\n\nआपकी booking के बारे में बात करनी थी।\n\nधन्यवाद,\nकैमरामैन प्रो`
            },
            style: 'success'
        },
        ...(booking.financials.balanceDue > 0 ? [{
            type: 'update' as const,
            label: '💰 भुगतान अपडेट करें',
            data: { bookingId: booking.id, action: 'add_payment' },
            style: 'secondary' as const
        }] : [])
    ];
}
