import { useState } from "react";
import { generateQuote, QuoteInput, QuoteResult } from "../../lib/studioAI";
import { Sparkles, ChevronDown, ChevronUp, Loader2, RefreshCw, Info } from "lucide-react";
import { formatMoney } from "../../utils/currency";
import toast from "react-hot-toast";

// ─── Event options ────────────────────────────────────────────────────────────

const EVENT_TYPES = [
    "Wedding", "Pre-Wedding", "Birthday", "Corporate", "Haldi",
    "Mehndi", "Tilak", "Maternity", "Product Shoot", "Fashion",
];

const EQUIPMENT_OPTIONS = [
    "DSLR Camera", "Mirrorless Camera", "Drone", "LED Panel",
    "Gimbal Stabilizer", "Studio Lights", "Reflectors", "Tripod",
    "External Flash", "360° Camera",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
        {children}
    </label>
);

const NumberInput = ({ value, onChange, min, max, label }: {
    value: number; onChange: (v: number) => void; min: number; max: number; label: string;
}) => (
    <div>
        <FieldLabel>{label}</FieldLabel>
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => onChange(Math.max(min, value - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors font-bold"
            >−</button>
            <span className="w-10 text-center font-bold text-[var(--text-primary)] text-lg tabular-nums">{value}</span>
            <button
                type="button"
                onClick={() => onChange(Math.min(max, value + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors font-bold"
            >+</button>
        </div>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const QuoteGenerator = () => {
    const [form, setForm] = useState<QuoteInput>({
        eventType: "Wedding",
        numberOfDays: 1,
        equipmentList: [],
        teamSize: 2,
    });
    const [result, setResult] = useState<QuoteResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [showBreak, setShowBreak] = useState(true);

    const toggleEquipment = (item: string) => {
        setForm(f => ({
            ...f,
            equipmentList: f.equipmentList.includes(item)
                ? f.equipmentList.filter(e => e !== item)
                : [...f.equipmentList, item],
        }));
    };

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await generateQuote(form);
            setResult(res);
        } catch (e: any) {
            toast.error(e?.message ?? "AI failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* ── Form ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Event Type */}
                <div className="sm:col-span-2">
                    <FieldLabel>Event Type</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                        {EVENT_TYPES.map(et => (
                            <button
                                key={et}
                                onClick={() => setForm(f => ({ ...f, eventType: et }))}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                                    ${form.eventType === et
                                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm"
                                        : "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)]"
                                    }`}
                            >
                                {et}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Days */}
                <NumberInput
                    label="Number of Days"
                    value={form.numberOfDays}
                    onChange={v => setForm(f => ({ ...f, numberOfDays: v }))}
                    min={1} max={7}
                />

                {/* Team Size */}
                <NumberInput
                    label="Team Size"
                    value={form.teamSize}
                    onChange={v => setForm(f => ({ ...f, teamSize: v }))}
                    min={1} max={15}
                />

                {/* Equipment */}
                <div className="sm:col-span-2">
                    <FieldLabel>Equipment Used ({form.equipmentList.length} selected)</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_OPTIONS.map(eq => (
                            <button
                                key={eq}
                                onClick={() => toggleEquipment(eq)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all
                                    ${form.equipmentList.includes(eq)
                                        ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400"
                                        : "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]"
                                    }`}
                            >
                                {eq}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99]"
            >
                {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Generating Quote...</>
                    : <><Sparkles size={18} /> Generate AI Quote</>
                }
            </button>

            {/* ── Result ── */}
            {result && (
                <div className="space-y-4 animate-fade-in">
                    {/* Suggested Price */}
                    <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">AI Suggested Price</p>
                            <p className="text-4xl font-black text-[var(--text-primary)]">
                                {formatMoney(result.suggestedPrice)}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                                Range: {formatMoney(result.priceRange.min)} – {formatMoney(result.priceRange.max)}
                            </p>
                        </div>
                        <button
                            onClick={handleGenerate}
                            className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors p-2 rounded-lg hover:bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-light)]"
                        >
                            <RefreshCw size={13} /> Regenerate
                        </button>
                    </div>

                    {/* Breakdown */}
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl overflow-hidden">
                        <button
                            onClick={() => setShowBreak(b => !b)}
                            className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                        >
                            <span>Price Breakdown</span>
                            {showBreak ? <ChevronUp size={16} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={16} className="text-[var(--text-tertiary)]" />}
                        </button>
                        {showBreak && (
                            <div className="border-t border-[var(--border-light)]">
                                {result.breakdown.map((row, i) => (
                                    <div key={i} className={`flex justify-between items-center px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-[var(--surface-base)]" : ""}`}>
                                        <span className="text-[var(--text-secondary)]">{row.label}</span>
                                        <span className="font-semibold text-[var(--text-primary)] tabular-nums">{formatMoney(row.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rationale */}
                    <div className="flex gap-2.5 p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                        <Info size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{result.rationale}</p>
                    </div>

                    {/* Tips */}
                    {result.tips?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">💡 Pro Tips</p>
                            {result.tips.map((tip, i) => (
                                <div key={i} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                                    <span className="text-emerald-500 font-bold shrink-0">→</span>
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
