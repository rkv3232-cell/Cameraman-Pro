import { useState } from "react";
import { estimateBudget, BudgetInput, BudgetResult } from "../../lib/studioAI";
import { Sparkles, Loader2, RefreshCw, TrendingDown, Lightbulb, Car, Users, Camera, Clock, Moon } from "lucide-react";
import { formatMoney } from "../../utils/currency";
import toast from "react-hot-toast";

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
    "Wedding", "Pre-Wedding", "Birthday", "Corporate", "Haldi",
    "Mehndi", "Tilak", "Maternity", "Product Shoot", "Fashion",
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Travel: <Car size={14} />,
    Team: <Users size={14} />,
    Equipment: <Camera size={14} />,
    Editing: <Clock size={14} />,
    Stay: <Moon size={14} />,
};

const categoryColor = (cat: string) => {
    const map: Record<string, string> = {
        Travel: "text-blue-500    bg-blue-500/10    border-blue-500/20",
        Team: "text-purple-500  bg-purple-500/10  border-purple-500/20",
        Equipment: "text-orange-500  bg-orange-500/10  border-orange-500/20",
        Editing: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        Stay: "text-indigo-500  bg-indigo-500/10  border-indigo-500/20",
    };
    return map[cat] ?? "text-gray-500 bg-gray-500/10 border-gray-500/20";
};

// ─── Slider Input ─────────────────────────────────────────────────────────────

const SliderField = ({ label, value, onChange, min, max, step = 1, formatVal }: {
    label: string; value: number; onChange: (v: number) => void;
    min: number; max: number; step?: number; formatVal?: (v: number) => string;
}) => (
    <div>
        <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{label}</label>
            <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{formatVal ? formatVal(value) : value}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-[var(--border-light)] accent-[var(--accent-primary)] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mt-0.5">
            <span>{formatVal ? formatVal(min) : min}</span>
            <span>{formatVal ? formatVal(max) : max}</span>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const BudgetEstimator = () => {
    const [form, setForm] = useState<BudgetInput>({
        eventType: "Wedding",
        numberOfDays: 1,
        travelKm: 50,
        teamSize: 3,
        equipmentCount: 5,
        editingHours: 20,
        hasStay: false,
    });
    const [result, setResult] = useState<BudgetResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await estimateBudget(form);
            setResult(res);
        } catch (e: any) {
            toast.error(e?.message ?? "AI failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Group breakdown by category
    const grouped = result
        ? result.breakdown.reduce((acc, item) => {
            (acc[item.category] ??= []).push(item);
            return acc;
        }, {} as Record<string, typeof result.breakdown>)
        : {};

    return (
        <div className="space-y-6">
            {/* ── Event Type ── */}
            <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Event Type</label>
                <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map(et => (
                        <button
                            key={et}
                            onClick={() => setForm(f => ({ ...f, eventType: et }))}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                                ${form.eventType === et
                                    ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm"
                                    : "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40"
                                }`}
                        >
                            {et}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Sliders ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <SliderField label="Number of Days" value={form.numberOfDays} onChange={v => setForm(f => ({ ...f, numberOfDays: v }))} min={1} max={7} />
                <SliderField label="Travel Distance" value={form.travelKm} onChange={v => setForm(f => ({ ...f, travelKm: v }))} min={0} max={500} step={10} formatVal={v => `${v} km`} />
                <SliderField label="Team Size" value={form.teamSize} onChange={v => setForm(f => ({ ...f, teamSize: v }))} min={1} max={12} />
                <SliderField label="Equipment Pieces" value={form.equipmentCount} onChange={v => setForm(f => ({ ...f, equipmentCount: v }))} min={1} max={20} />
                <SliderField label="Editing Hours" value={form.editingHours} onChange={v => setForm(f => ({ ...f, editingHours: v }))} min={2} max={80} step={2} formatVal={v => `${v}h`} />

                {/* Overnight Stay Toggle */}
                <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl">
                    <div className="flex items-center gap-2.5">
                        <Moon size={16} className="text-indigo-500" />
                        <div>
                            <p className="text-xs font-semibold text-[var(--text-primary)]">Overnight Stay</p>
                            <p className="text-[10px] text-[var(--text-tertiary)]">Hotel/accommodation required</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setForm(f => ({ ...f, hasStay: !f.hasStay }))}
                        className={`relative w-10 h-5.5 rounded-full transition-colors border ${form.hasStay
                                ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]"
                                : "bg-[var(--border-light)] border-[var(--border-medium)]"
                            }`}
                        style={{ height: "22px" }}
                    >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.hasStay ? "left-5" : "left-0.5"}`} />
                    </button>
                </div>
            </div>

            {/* Generate */}
            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99]"
            >
                {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Estimating Budget...</>
                    : <><Sparkles size={18} /> Estimate Budget</>
                }
            </button>

            {/* ── Result ── */}
            {result && (
                <div className="space-y-4 animate-fade-in">
                    {/* Grand Total Banner */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-5">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Estimated Total Cost</p>
                                <p className="text-4xl font-black text-[var(--text-primary)]">{formatMoney(result.grandTotal)}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    Base {formatMoney(result.totalEstimated)} + 10% contingency {formatMoney(result.contingency)}
                                </p>
                            </div>
                            <button
                                onClick={handleGenerate}
                                className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-light)]"
                            >
                                <RefreshCw size={13} /> Recalculate
                            </button>
                        </div>
                    </div>

                    {/* Category Breakdown */}
                    <div className="space-y-3">
                        {Object.entries(grouped).map(([cat, items]) => {
                            const catTotal = items.reduce((s, i) => s + i.estimated, 0);
                            const pct = result.totalEstimated > 0 ? Math.round((catTotal / result.totalEstimated) * 100) : 0;
                            const colorClass = categoryColor(cat);
                            const iconNode = CATEGORY_ICONS[cat];

                            return (
                                <div key={cat} className="bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl overflow-hidden">
                                    {/* Category header */}
                                    <div className="flex items-center justify-between px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`p-1.5 rounded-lg border text-xs ${colorClass}`}>{iconNode}</span>
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">{cat}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-[var(--text-primary)] tabular-nums">{formatMoney(catTotal)}</span>
                                            <span className="text-[10px] text-[var(--text-tertiary)] ml-1.5">{pct}%</span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="px-4 pb-2">
                                        <div className="w-full bg-[var(--border-light)] rounded-full h-1">
                                            <div
                                                className="h-1 rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, background: "var(--accent-primary)" }}
                                            />
                                        </div>
                                    </div>
                                    {/* Line items */}
                                    {items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start px-4 py-2 border-t border-[var(--border-light)] bg-[var(--surface-base)]">
                                            <div>
                                                <p className="text-xs text-[var(--text-primary)]">{item.item}</p>
                                                <p className="text-[10px] text-[var(--text-tertiary)]">{item.notes}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-[var(--text-primary)] tabular-nums shrink-0 ml-3">
                                                {formatMoney(item.estimated)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>

                    {/* Savings Tips */}
                    {result.savingsTips?.length > 0 && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                <TrendingDown size={13} />
                                Cost Saving Tips
                            </div>
                            {result.savingsTips.map((tip, i) => (
                                <div key={i} className="flex gap-2 text-xs text-amber-800 dark:text-amber-200">
                                    <Lightbulb size={12} className="shrink-0 mt-0.5 text-amber-500" />
                                    {tip}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
