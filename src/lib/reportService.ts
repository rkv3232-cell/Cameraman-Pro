import { Booking, Expense, ExpenseCategory, ReportData } from '../types';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { normalizeFirestoreDate } from '../utils/date';

/**
 * Generate Daily or Weekly Report from bookings + expenses data
 */
export function generateReport(
    period: 'daily' | 'weekly',
    bookings: Booking[],
    expenses: Expense[],
    referenceDate: Date = new Date()
): ReportData {
    const start = period === 'daily'
        ? startOfDay(referenceDate)
        : startOfWeek(referenceDate, { weekStartsOn: 1 });

    const end = period === 'daily'
        ? endOfDay(referenceDate)
        : endOfWeek(referenceDate, { weekStartsOn: 1 });

    const interval = { start, end };

    // Filter bookings in period
    const periodBookings = bookings.filter(b => {
        const date = normalizeFirestoreDate(b.eventDate) || new Date();
        return isWithinInterval(date, interval);
    });

    // Filter expenses in period
    const periodExpenses = expenses.filter(e => {
        const date = e.date?.toDate ? e.date.toDate() : new Date(e.date as any);
        return isWithinInterval(date, interval);
    });

    // Calculate revenue (from confirmed + completed bookings)
    const totalRevenue = periodBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .reduce((sum, b) => sum + (b.financials?.totalAmount || 0), 0);

    // Calculate expenses
    const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Pending payments
    const pendingPayments = periodBookings.reduce((sum, b) => {
        const due = (b.financials?.totalAmount || 0) - (b.financials?.advancePaid || 0);
        return sum + (due > 0 ? due : 0);
    }, 0);

    // Expense breakdown by category
    const expenseBreakdown: Record<ExpenseCategory, number> = {
        fuel: 0,
        assistant_payment: 0,
        repair_maintenance: 0,
        miscellaneous: 0
    };

    periodExpenses.forEach(e => {
        expenseBreakdown[e.category] = (expenseBreakdown[e.category] || 0) + e.amount;
    });

    // Top clients by revenue
    const clientRevMap: Record<string, number> = {};
    periodBookings
        .filter(b => b.status === 'confirmed' || b.status === 'completed')
        .forEach(b => {
            clientRevMap[b.clientName] = (clientRevMap[b.clientName] || 0) + (b.financials?.totalAmount || 0);
        });

    const topClients = Object.entries(clientRevMap)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    return {
        period,
        startDate: start,
        endDate: end,
        totalBookings: periodBookings.length,
        completedBookings: periodBookings.filter(b => b.status === 'completed').length,
        pendingBookings: periodBookings.filter(b => b.status === 'pending').length,
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        pendingPayments,
        expenseBreakdown,
        topClients
    };
}

/**
 * Format report data into human-readable summary (Hindi/Hinglish)
 */
export function formatReportSummary(report: ReportData): string {
    const formatAmt = (paise: number) => `₹${Math.floor(paise / 100).toLocaleString('en-IN')}`;
    const periodLabel = report.period === 'daily' ? 'आज' : 'इस हफ्ते';

    const lines = [
        `📊 ${periodLabel} की रिपोर्ट`,
        `──────────────────────`,
        `📅 Bookings: ${report.totalBookings}`,
        `   ✅ Completed: ${report.completedBookings}`,
        `   ⏳ Pending: ${report.pendingBookings}`,
        ``,
        `💰 Revenue: ${formatAmt(report.totalRevenue)}`,
        `💸 Expenses: ${formatAmt(report.totalExpenses)}`,
        `📈 Net Profit: ${formatAmt(report.netProfit)}`,
        ``,
        `⚠️ Pending Payments: ${formatAmt(report.pendingPayments)}`,
        ``,
        `📊 Expense Breakdown:`,
        `   ⛽ Fuel: ${formatAmt(report.expenseBreakdown.fuel)}`,
        `   👷 Assistant: ${formatAmt(report.expenseBreakdown.assistant_payment)}`,
        `   🔧 Repair: ${formatAmt(report.expenseBreakdown.repair_maintenance)}`,
        `   📦 Misc: ${formatAmt(report.expenseBreakdown.miscellaneous)}`,
    ];

    if (report.topClients.length > 0) {
        lines.push('', '🏆 Top Clients:');
        report.topClients.forEach((c, i) => {
            lines.push(`   ${i + 1}. ${c.name}: ${formatAmt(c.revenue)}`);
        });
    }

    return lines.join('\n');
}
