import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useExpenses } from "../hooks/useExpenses";
import { useBookings } from "../hooks/useBookings";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/Modal";
import { Plus, Fuel, Users, Wrench, MoreHorizontal, Trash2, TrendingDown, TrendingUp, Search } from "lucide-react";
import { ExpenseCategory } from "../types";
import { formatMoney } from "../utils/currency";
import { format } from "date-fns";

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; labelHi: string; icon: any; color: string }> = {
    fuel: { label: 'Fuel', labelHi: 'ईंधन', icon: Fuel, color: 'text-orange-500' },
    assistant_payment: { label: 'Assistant', labelHi: 'सहायक', icon: Users, color: 'text-blue-500' },
    repair_maintenance: { label: 'Repair', labelHi: 'मरम्मत', icon: Wrench, color: 'text-red-500' },
    miscellaneous: { label: 'Misc', labelHi: 'अन्य', icon: MoreHorizontal, color: 'text-purple-500' },
};

export const Expenses = () => {
    const navigate = useNavigate();
    const { expenses, loading, indexError, addExpense, deleteExpense, analytics } = useExpenses();
    const { bookings } = useBookings();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
    const [dateFilter, setDateFilter] = useState("");
    const [form, setForm] = useState({
        amount: '',
        category: 'fuel' as ExpenseCategory,
        date: new Date().toISOString().split('T')[0],
        linkedBookingId: '',
        notes: ''
    });

    // Revenue calculation for profit
    const revenueThisMonth = useMemo(() => {
        const now = new Date();
        return bookings
            .filter(b => {
                const d = b.eventDate?.toDate ? b.eventDate.toDate() : new Date(b.eventDate as any);
                return (
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear() &&
                    (b.status === 'confirmed' || b.status === 'completed')
                );
            })
            .reduce((sum, b) => sum + (b.financials?.totalAmount || 0), 0);
    }, [bookings]);

    const netProfit = revenueThisMonth - analytics.totalThisMonth;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || parseFloat(form.amount) <= 0) return;

        const linkedBooking = bookings.find(b => b.id === form.linkedBookingId);

        await addExpense({
            amount: parseFloat(form.amount),
            category: form.category,
            date: new Date(form.date),
            linkedBookingId: form.linkedBookingId || null,
            linkedBookingName: linkedBooking?.clientName || '',
            notes: form.notes
        });

        setIsModalOpen(false);
        setForm({ amount: '', category: 'fuel', date: new Date().toISOString().split('T')[0], linkedBookingId: '', notes: '' });
    };

    const filteredExpenses = expenses.filter(e => {
        const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
        
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date as any);
        const formattedDate = format(d, 'MMM dd yyyy').toLowerCase();
        
        const matchesSearch = !searchTerm ||
            e.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.linkedBookingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            formattedDate.includes(searchTerm.toLowerCase());
            
        const matchesDate = !dateFilter || format(d, 'yyyy-MM-dd') === dateFilter;
        
        return matchesCategory && matchesSearch && matchesDate;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Expenses</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Button>
            </div>

            {/* ── Firestore index missing warning ── */}
            {indexError && (
                <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-sm">
                    <span className="text-xl leading-snug">⚠️</span>
                    <div className="min-w-0">
                        <p className="font-semibold text-amber-800 dark:text-amber-300">
                            Firestore composite index missing
                        </p>
                        <p className="text-amber-700 dark:text-amber-400 text-xs mt-0.5">
                            Expenses are visible (unsorted) but the index for{" "}
                            <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                                studioId + date
                            </code>{" "}
                            is required for correct ordering and fast queries.
                        </p>
                        <a
                            href="https://console.firebase.google.com/project/cameraman-pro-2aa2b/firestore/indexes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-2 text-xs font-bold text-amber-900 dark:text-amber-200 underline hover:opacity-75 transition-opacity"
                        >
                            → Open Firebase Console › Create Index
                        </a>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">
                            Fields: <strong>studioId</strong> (ASC) + <strong>date</strong> (DESC) on collection{" "}
                            <strong>expenses</strong>. Check the browser console for the direct auto-fill link.
                        </p>
                    </div>
                </div>
            )}

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Revenue */}
                <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[var(--text-secondary)]">Revenue (This Month)</p>
                        <TrendingUp size={18} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(revenueThisMonth / 100)}</h3>
                </div>

                {/* Expenses */}
                <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[var(--text-secondary)]">Expenses (This Month)</p>
                        <TrendingDown size={18} className="text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatMoney(analytics.totalThisMonth / 100)}</h3>
                </div>

                {/* Net Profit */}
                <div className={`bg-[var(--surface-base)] rounded-xl border p-5 shadow-sm ${netProfit >= 0 ? 'border-emerald-200 dark:border-emerald-500/20' : 'border-red-200 dark:border-red-500/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-[var(--text-secondary)]">Net Profit</p>
                        {netProfit >= 0
                            ? <TrendingUp size={18} className="text-emerald-500" />
                            : <TrendingDown size={18} className="text-red-500" />
                        }
                    </div>
                    <h3 className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatMoney(netProfit / 100)}
                    </h3>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-4 uppercase tracking-wider">This Month Breakdown</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                            <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]">
                                <div className={`p-2 rounded-lg bg-[var(--surface-base)] ${config.color}`}>
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)]">{config.label}</p>
                                    <p className="text-sm font-bold text-[var(--text-primary)]">
                                        {formatMoney((analytics.byCategory[key] || 0) / 100)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap gap-4 items-center bg-[var(--surface-base)] p-4 rounded-xl border border-[var(--border-light)] shadow-sm overflow-x-auto">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] h-4 w-4" />
                    <Input
                        placeholder="Search notes, bookings, or date..."
                        className="pl-9 bg-[var(--bg-secondary)] border-[var(--border-light)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-light)]">
                    <input
                        type="date"
                        className="bg-transparent border-none text-sm text-[var(--text-primary)] focus:outline-none p-1.5"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                    {dateFilter && (
                        <button 
                            onClick={() => setDateFilter("")}
                            className="px-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            ×
                        </button>
                    )}
                </div>
                <div className="flex bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-light)]">
                    {(['all', 'fuel', 'assistant_payment', 'repair_maintenance', 'miscellaneous'] as const).map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all whitespace-nowrap
                                ${categoryFilter === cat
                                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'}`}
                        >
                            {cat === 'all' ? 'All' : CATEGORY_CONFIG[cat]?.label || cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Expenses List */}
            {loading ? (
                <div className="p-12 text-center text-[var(--text-secondary)]">Loading expenses...</div>
            ) : filteredExpenses.length > 0 ? (
                <div className="space-y-3">
                    {filteredExpenses.map(expense => {
                        const config = CATEGORY_CONFIG[expense.category];
                        const Icon = config?.icon || MoreHorizontal;
                        const d = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date as any);

                        return (
                            <div
                                key={expense.id}
                                onClick={() => navigate(`/expenses/${expense.id}`)}
                                className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all group cursor-pointer"
                            >
                                <div className={`p-2.5 rounded-lg bg-[var(--bg-secondary)] ${config?.color || 'text-gray-500'}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-[var(--text-primary)] text-sm capitalize">
                                            {config?.label || expense.category}
                                        </h4>
                                        {expense.linkedBookingName && (
                                            <span className="text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full">
                                                {expense.linkedBookingName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                        {format(d, 'dd MMM yyyy')} {expense.notes && `• ${expense.notes}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-base font-bold text-red-600 dark:text-red-400">
                                        -{formatMoney(expense.amount / 100)}
                                    </p>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm("Delete this expense?")) deleteExpense(expense.id);
                                    }}
                                    className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="p-12 text-center bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] border-dashed shadow-sm">
                    <div className="inline-block p-4 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-4">
                        <TrendingDown size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">No expenses found</h3>
                    <p className="text-[var(--text-secondary)] mt-1 mb-6">Track your business expenses to see net profit.</p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add First Expense
                    </Button>
                </div>
            )}

            {/* Add Expense Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Expense">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Amount (₹) *"
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        placeholder="e.g. 500"
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Category *</label>
                        <select
                            className="w-full h-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                        >
                            <option value="fuel">⛽ Fuel / ईंधन</option>
                            <option value="assistant_payment">👷 Assistant Payment / सहायक</option>
                            <option value="repair_maintenance">🔧 Repair & Maintenance / मरम्मत</option>
                            <option value="miscellaneous">📦 Miscellaneous / अन्य</option>
                        </select>
                    </div>

                    <Input
                        label="Date *"
                        type="date"
                        value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Link to Booking (optional)</label>
                        <select
                            className="w-full h-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
                            value={form.linkedBookingId}
                            onChange={e => setForm({ ...form, linkedBookingId: e.target.value })}
                        >
                            <option value="">— No booking linked —</option>
                            {bookings.map(b => (
                                <option key={b.id} value={b.id}>{b.clientName} — {b.eventType}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Notes"
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="e.g. Petrol for wedding shoot"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Add Expense</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
