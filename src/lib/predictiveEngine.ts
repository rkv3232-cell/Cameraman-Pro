import { Booking, Expense, InventoryItem, PredictiveAlert } from '../types';
import { addDays, isWithinInterval, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { toSafeDate } from '../utils/date';

/**
 * BĀBU Predictive Intelligence Engine
 * Analyzes upcoming data to PREDICT issues before they happen
 */
export class PredictiveEngine {
    private bookings: Booking[];
    private expenses: Expense[];
    private inventory: InventoryItem[];

    constructor(bookings: Booking[], expenses: Expense[], inventory: InventoryItem[]) {
        this.bookings = bookings;
        this.expenses = expenses;
        this.inventory = inventory;
    }

    /**
     * Run all predictive analyses
     */
    public analyze(): PredictiveAlert[] {
        const alerts: PredictiveAlert[] = [];

        alerts.push(...this.predictWorkloadOverload());
        alerts.push(...this.predictEquipmentShortage());
        alerts.push(...this.predictEditorOverload());
        alerts.push(...this.detectHighExpenses());
        alerts.push(...this.detectProfitMarginDrop());

        return alerts;
    }

    /**
     * 🔥 Next 7 days heavy workload alert
     */
    private predictWorkloadOverload(): PredictiveAlert[] {
        const alerts: PredictiveAlert[] = [];
        const now = new Date();
        const next7Days = { start: startOfDay(now), end: endOfDay(addDays(now, 7)) };

        const upcomingShoots = this.bookings.filter(b => {
            const date = toSafeDate(b.eventDate);
            return (
                isWithinInterval(date, next7Days) &&
                (b.status === 'confirmed' || b.status === 'pending')
            );
        });

        if (upcomingShoots.length >= 4) {
            alerts.push({
                id: 'workload-overload-7d',
                type: 'workload',
                severity: upcomingShoots.length >= 6 ? 'critical' : 'warning',
                title: `⚠️ अगले 7 दिनों में ${upcomingShoots.length} shoots!`,
                message: `Heavy workload ahead. Plan your resources carefully.`,
                suggestedActions: [
                    'Backup assistant को inform करें',
                    'Equipment readiness check करें',
                    'Shoots ka schedule stagger करें',
                    'Extra staff assign करें'
                ],
                timestamp: new Date(),
                data: { shoots: upcomingShoots.length }
            });
        }

        return alerts;
    }

    /**
     * 📦 Equipment shortage prediction
     */
    private predictEquipmentShortage(): PredictiveAlert[] {
        const alerts: PredictiveAlert[] = [];
        const now = new Date();
        const next7Days = { start: startOfDay(now), end: endOfDay(addDays(now, 7)) };

        // Get upcoming bookings with equipment
        const upcomingShoots = this.bookings.filter(b => {
            const date = toSafeDate(b.eventDate);
            return (
                isWithinInterval(date, next7Days) &&
                (b.status === 'confirmed' || b.status === 'pending')
            );
        });

        // Count required equipment per day
        const availableCameras = this.inventory.filter(
            i => i.category === 'camera' && i.status === 'available'
        ).length;

        // Check for days with more shoots than cameras
        const dateMap: Record<string, number> = {};
        upcomingShoots.forEach(b => {
            const dateKey = toSafeDate(b.eventDate).toISOString().split('T')[0];
            dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;
        });

        Object.entries(dateMap).forEach(([date, count]) => {
            if (count > availableCameras && availableCameras > 0) {
                alerts.push({
                    id: `equipment-shortage-${date}`,
                    type: 'equipment_shortage',
                    severity: 'critical',
                    title: `🚨 ${date} को ${count} shoots लेकिन सिर्फ ${availableCameras} cameras!`,
                    message: `Equipment shortage expected. Arrange backup.`,
                    suggestedActions: [
                        'Backup camera arrange करें',
                        'एक shoot reschedule करें',
                        'Rental equipment book करें'
                    ],
                    timestamp: new Date(),
                    data: { date, shoots: count, cameras: availableCameras }
                });
            }
        });

        return alerts;
    }

    /**
     * 🎬 Editor overload detection
     */
    private predictEditorOverload(): PredictiveAlert[] {
        const alerts: PredictiveAlert[] = [];

        const pendingEditing = this.bookings.filter(b => {
            const pp = b.postProductionStatus;
            return (
                b.status === 'completed' &&
                pp &&
                pp.progress < 100 &&
                !pp.photoEditing
            );
        });

        if (pendingEditing.length >= 3) {
            const oldestDays = pendingEditing.reduce((max, b) => {
                const days = differenceInDays(new Date(), toSafeDate(b.eventDate));
                return Math.max(max, days);
            }, 0);

            alerts.push({
                id: 'editor-overload',
                type: 'editor_overload',
                severity: oldestDays > 14 ? 'critical' : 'warning',
                title: `⚠️ ${pendingEditing.length} shoots editing pending!`,
                message: `सबसे पुरानी shoot ${oldestDays} दिन पहले की है। Editor overloaded.`,
                suggestedActions: [
                    'Freelance editor hire करें',
                    'Priority order set करें',
                    'Client को timeline update दें'
                ],
                timestamp: new Date(),
                data: { pending: pendingEditing.length, oldestDays }
            });
        }

        return alerts;
    }

    /**
     * 💸 Unusually high expense detection
     */
    private detectHighExpenses(): PredictiveAlert[] {
        const alerts: PredictiveAlert[] = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonthExpenses = this.expenses.filter(e => {
            const d = toSafeDate(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthExpenses = this.expenses.filter(e => {
            const d = toSafeDate(e.date);
            const lm = currentMonth === 0 ? 11 : currentMonth - 1;
            const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
            return d.getMonth() === lm && d.getFullYear() === ly;
        });

        const thisTotal = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
        const lastTotal = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);

        if (lastTotal > 0 && thisTotal > lastTotal * 1.5) {
            const increase = Math.round(((thisTotal - lastTotal) / lastTotal) * 100);
            alerts.push({
                id: 'high-expense-alert',
                type: 'high_expense',
                severity: 'warning',
                title: `💸 इस महीने खर्चा ${increase}% ज़्यादा है!`,
                message: `पिछले महीने से काफ़ी ज़्यादा expense हो रहा है।`,
                suggestedActions: [
                    'Expense breakdown check करें',
                    'Unnecessary expenses cut करें',
                    'Budget plan बनाएं'
                ],
                timestamp: new Date(),
                data: { thisTotal, lastTotal, increase }
            });
        }

        return alerts;
    }

    /**
     * 📉 Profit margin drop detection
     */
    private detectProfitMarginDrop(): PredictiveAlert[] {
        const alerts: PredictiveAlert[] = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // This month's revenue
        const thisMonthRevenue = this.bookings
            .filter(b => {
                const d = toSafeDate(b.eventDate);
                return (
                    d.getMonth() === currentMonth &&
                    d.getFullYear() === currentYear &&
                    (b.status === 'confirmed' || b.status === 'completed')
                );
            })
            .reduce((sum, b) => sum + (b.financials?.totalAmount || 0), 0);

        // This month's expenses
        const thisMonthExpenses = this.expenses
            .filter(e => {
                const d = toSafeDate(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            })
            .reduce((sum, e) => sum + e.amount, 0);

        if (thisMonthRevenue > 0) {
            const margin = ((thisMonthRevenue - thisMonthExpenses) / thisMonthRevenue) * 100;

            if (margin < 30) {
                alerts.push({
                    id: 'profit-margin-low',
                    type: 'profit_drop',
                    severity: margin < 15 ? 'critical' : 'warning',
                    title: `📉 Profit margin सिर्फ ${Math.round(margin)}% है!`,
                    message: `Revenue ₹${Math.floor(thisMonthRevenue / 100).toLocaleString('en-IN')}, Expenses ₹${Math.floor(thisMonthExpenses / 100).toLocaleString('en-IN')}`,
                    suggestedActions: [
                        'Pricing revisit करें',
                        'Expenses reduce करें',
                        'High-value shoots target करें'
                    ],
                    timestamp: new Date(),
                    data: { revenue: thisMonthRevenue, expenses: thisMonthExpenses, margin }
                });
            }
        }

        return alerts;
    }
}

/**
 * Create predictive engine instance
 */
export function createPredictiveEngine(
    bookings: Booking[],
    expenses: Expense[],
    inventory: InventoryItem[]
): PredictiveEngine {
    return new PredictiveEngine(bookings, expenses, inventory);
}
