import { Booking } from '../types';
import {
    detectEquipmentConflicts,
    getPendingPostProduction
} from './babuIntelligence';
import { isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

/**
 * Agent alert interface
 */
export interface AgentAlert {
    id: string;
    severity: AlertSeverity;
    title: string;
    message: string;
    timestamp: Date;
    actions?: {
        label: string;
        type: 'execute' | 'navigate' | 'dismiss';
        data?: any;
    }[];
    autoExecutable?: boolean;
    dismissed?: boolean;
}

/**
 * Convert Timestamp to Date
 */
function toDate(timestamp: any): Date {
    return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
}

/**
 * BĀBU Agent Monitoring System
 * Continuously analyzes studio operations and generates proactive alerts
 */
export class BabuAgent {
    private bookings: Booking[];
    private lastCheck: Date;
    private alerts: Map<string, AgentAlert>;

    constructor(bookings: Booking[]) {
        this.bookings = bookings;
        this.lastCheck = new Date();
        this.alerts = new Map();
    }

    /**
     * Main monitoring loop - checks all systems
     */
    public monitorStudio(): AgentAlert[] {
        const newAlerts: AgentAlert[] = [];

        // 1. Check for unconfirmed bookings
        newAlerts.push(...this.checkUnconfirmedBookings());

        // 2. Check for payment delays
        newAlerts.push(...this.checkPaymentDelays());

        // 3. Check for equipment conflicts
        newAlerts.push(...this.checkEquipmentConflicts());

        // 4. Check for post-production delays
        newAlerts.push(...this.checkPostProductionDelays());

        // 5. Check for upcoming shoots without equipment
        newAlerts.push(...this.checkMissingEquipmentAssignments());

        // 6. Check for shoots happening today
        newAlerts.push(...this.checkTodayShots());

        // Store alerts
        newAlerts.forEach(alert => {
            this.alerts.set(alert.id, alert);
        });

        this.lastCheck = new Date();
        return newAlerts;
    }

    /**
     * Check for bookings that need confirmation
     */
    private checkUnconfirmedBookings(): AgentAlert[] {
        const alerts: AgentAlert[] = [];
        const pendingBookings = this.bookings.filter(b =>
            b.status === 'pending' &&
            isTomorrow(toDate(b.eventDate))
        );

        if (pendingBookings.length > 0) {
            pendingBookings.forEach(booking => {
                alerts.push({
                    id: `unconfirmed-${booking.id}`,
                    severity: 'critical',
                    title: '🚨 कल की shoot अभी confirm नहीं!',
                    message: `${booking.clientName} की booking pending है। तुरंत confirm करें या reschedule करें।`,
                    timestamp: new Date(),
                    actions: [
                        {
                            label: '✅ Confirm कर दें',
                            type: 'execute',
                            data: { bookingId: booking.id, action: 'confirm' }
                        },
                        {
                            label: '📄 Booking खोलें',
                            type: 'navigate',
                            data: { page: `/bookings/${booking.id}` }
                        },
                        {
                            label: '💬 Client को WhatsApp करें',
                            type: 'execute',
                            data: {
                                action: 'whatsapp',
                                phone: booking.clientPhone,
                                message: `नमस्ते ${booking.clientName} जी, कल की shoot confirm करनी है। कृपया बताएं।`
                            }
                        }
                    ],
                    autoExecutable: false
                });
            });
        }

        return alerts;
    }

    /**
     * Check for overdue payments
     */
    private checkPaymentDelays(): AgentAlert[] {
        const alerts: AgentAlert[] = [];
        const overdueBookings = this.bookings.filter(b => {
            const shootDate = toDate(b.eventDate);
            const daysSinceShoot = differenceInDays(new Date(), shootDate);
            return (
                b.financials.balanceDue > 0 &&
                isPast(shootDate) &&
                b.status === 'completed' &&
                daysSinceShoot > 3 // More than 3 days overdue
            );
        });

        if (overdueBookings.length > 0) {
            const totalOverdue = overdueBookings.reduce((sum, b) => sum + b.financials.balanceDue, 0) / 100;

            alerts.push({
                id: 'payment-overdue',
                severity: 'warning',
                title: `⚠️ ${overdueBookings.length} payments overdue (₹${totalOverdue.toLocaleString('en-IN')})`,
                message: `3+ दिन हो गए, payment reminders भेजें।`,
                timestamp: new Date(),
                actions: [
                    {
                        label: '💬 सभी को Reminder भेजें',
                        type: 'execute',
                        data: { action: 'send_payment_reminders', bookings: overdueBookings.map(b => b.id) }
                    },
                    {
                        label: '📋 List देखें',
                        type: 'navigate',
                        data: { page: '/bookings?filter=pending-payment' }
                    }
                ],
                autoExecutable: true // Can auto-send reminders
            });
        }

        return alerts;
    }

    /**
     * Check for equipment conflicts
     */
    private checkEquipmentConflicts(): AgentAlert[] {
        const alerts: AgentAlert[] = [];
        const conflicts = detectEquipmentConflicts(this.bookings);

        if (conflicts.length > 0) {
            conflicts.forEach((conflict, idx) => {
                alerts.push({
                    id: `equipment-conflict-${idx}`,
                    severity: 'critical',
                    title: `🚨 ${conflict.equipmentName} double booked!`,
                    message: `${conflict.conflictingBookings.map(b => b.clientName).join(' और ')} - दोनों को same equipment चाहिए।`,
                    timestamp: new Date(),
                    actions: [
                        {
                            label: 'Conflicts Resolve करें',
                            type: 'navigate',
                            data: { page: '/inventory' }
                        },
                        ...conflict.conflictingBookings.map(b => ({
                            label: `${b.clientName} की booking`,
                            type: 'navigate' as const,
                            data: { page: `/bookings/${b.id}` }
                        }))
                    ],
                    autoExecutable: false
                });
            });
        }

        return alerts;
    }

    /**
     * Check for post-production delays
     */
    private checkPostProductionDelays(): AgentAlert[] {
        const alerts: AgentAlert[] = [];
        const pendingPP = getPendingPostProduction(this.bookings);

        // Check for shoots completed >7 days ago with <50% progress
        const delayedPP = pendingPP.filter(item => {
            const shootDate = toDate(item.booking.eventDate);
            const daysSinceShoot = differenceInDays(new Date(), shootDate);
            return daysSinceShoot > 7 && item.progress < 50;
        });

        if (delayedPP.length > 0) {
            delayedPP.forEach(item => {
                alerts.push({
                    id: `pp-delay-${item.booking.id}`,
                    severity: 'warning',
                    title: `⚠️ Editing delay: ${item.booking.clientName}`,
                    message: `7+ दिन हो गए, अभी ${item.progress}% ही complete है।`,
                    timestamp: new Date(),
                    actions: [
                        {
                            label: '📄 Booking खोलें',
                            type: 'navigate',
                            data: { page: `/bookings/${item.booking.id}` }
                        },
                        {
                            label: '👤 Editor को remind करें',
                            type: 'execute',
                            data: { action: 'notify_editor', bookingId: item.booking.id }
                        }
                    ],
                    autoExecutable: false
                });
            });
        }

        return alerts;
    }

    /**
     * Check for upcoming shoots without equipment assigned
     */
    private checkMissingEquipmentAssignments(): AgentAlert[] {
        const alerts: AgentAlert[] = [];
        const upcomingWithoutGear = this.bookings.filter(b => {
            const shootDate = toDate(b.eventDate);
            return (
                (isToday(shootDate) || isTomorrow(shootDate)) &&
                b.status === 'confirmed' &&
                (!b.equipmentBooked || b.equipmentBooked.length === 0)
            );
        });

        if (upcomingWithoutGear.length > 0) {
            upcomingWithoutGear.forEach(booking => {
                const when = isToday(toDate(booking.eventDate)) ? 'आज' : 'कल';
                alerts.push({
                    id: `no-equipment-${booking.id}`,
                    severity: 'critical',
                    title: `🚨 ${when} की shoot में equipment assign नहीं!`,
                    message: `${booking.clientName} - ${booking.eventType}`,
                    timestamp: new Date(),
                    actions: [
                        {
                            label: '📦 Equipment Assign करें',
                            type: 'navigate',
                            data: { page: `/bookings/${booking.id}` }
                        }
                    ],
                    autoExecutable: false
                });
            });
        }

        return alerts;
    }

    /**
     * Check today's shoots and provide morning brief
     */
    private checkTodayShots(): AgentAlert[] {
        const alerts: AgentAlert[] = [];
        const todayShots = this.bookings.filter(b =>
            isToday(toDate(b.eventDate)) &&
            (b.status === 'confirmed' || b.status === 'pending')
        );

        if (todayShots.length > 0) {
            const hour = new Date().getHours();
            // Only show this alert in the morning (6 AM - 10 AM)
            if (hour >= 6 && hour <= 10) {
                alerts.push({
                    id: 'today-shoots',
                    severity: 'info',
                    title: `📅 आज ${todayShots.length} shoots scheduled`,
                    message: todayShots.map(s =>
                        `• ${s.clientName} - ${s.venue} (${s.eventType})`
                    ).join('\n'),
                    timestamp: new Date(),
                    actions: [
                        {
                            label: '📋 Today\'s Schedule',
                            type: 'navigate',
                            data: { page: '/calendar' }
                        }
                    ],
                    autoExecutable: false
                });
            }
        }

        return alerts;
    }

    /**
     * Get all active alerts
     */
    public getAlerts(): AgentAlert[] {
        return Array.from(this.alerts.values())
            .filter(alert => !alert.dismissed)
            .sort((a, b) => {
                // Sort by severity
                const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            });
    }

    /**
     * Dismiss an alert
     */
    public dismissAlert(alertId: string): void {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.dismissed = true;
        }
    }

    /**
     * Get statistics for agent dashboard
     */
    public getStats() {
        const alerts = this.getAlerts();
        return {
            critical: alerts.filter(a => a.severity === 'critical').length,
            warnings: alerts.filter(a => a.severity === 'warning').length,
            info: alerts.filter(a => a.severity === 'info').length,
            lastCheck: this.lastCheck,
            monitoring: {
                bookings: this.bookings.length,
                pending: this.bookings.filter(b => b.status === 'pending').length,
                confirmed: this.bookings.filter(b => b.status === 'confirmed').length,
                completed: this.bookings.filter(b => b.status === 'completed').length
            }
        };
    }
}

/**
 * Create agent instance
 */
export function createBabuAgent(bookings: Booking[]): BabuAgent {
    return new BabuAgent(bookings);
}
