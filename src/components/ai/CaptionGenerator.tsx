import { useState } from "react";
import { generateCaption, CaptionInput, CaptionResult } from "../../lib/studioAI";
import { Sparkles, Copy, Check, Loader2, Hash, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

// ─── Config ───────────────────────────────────────────────────────────────────

const EVENT_TYPES = [
    "Wedding", "Pre-Wedding", "Birthday", "Corporate", "Haldi",
    "Mehndi", "Tilak", "Maternity", "Product Shoot", "Fashion",
];

const MOODS = [
    { label: "Romantic 💕", value: "romantic" },
    { label: "Elegant ✨", value: "elegant" },
    { label: "Fun & Playful 🎉", value: "fun and playful" },
    { label: "Candid 📸", value: "candid and natural" },
    { label: "Cinematic 🎬", value: "cinematic and dramatic" },
    { label: "Vibrant & Colorful 🌈", value: "vibrant and colorful" },
];

// ─── Copy Button ──────────────────────────────────────────────────────────────

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied!", { duration: 1500 });
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
            title="Copy"
        >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const CaptionGenerator = () => {
    const [form, setForm] = useState<CaptionInput>({
        eventType: "Wedding",
        mood: "romantic",
        location: "",
        keywords: [],
    });
    const [keywordInput, setKeywordInput] = useState("");
    const [result, setResult] = useState<CaptionResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedCap, setSelectedCap] = useState(0);

    const addKeyword = () => {
        const kw = keywordInput.trim();
        if (!kw) return;
        if ((form.keywords?.length ?? 0) >= 6) { toast.error("Max 6 keywords"); return; }
        setForm(f => ({ ...f, keywords: [...(f.keywords ?? []), kw] }));
        setKeywordInput("");
    };

    const removeKeyword = (kw: string) =>
        setForm(f => ({ ...f, keywords: f.keywords?.filter(k => k !== kw) ?? [] }));

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await generateCaption(form);
            setResult(res);
            setSelectedCap(0);
        } catch (e: any) {
            toast.error(e?.message ?? "AI failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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

            {/* ── Mood ── */}
            <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Vibe / Mood</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MOODS.map(m => (
                        <button
                            key={m.value}
                            onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                            className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all text-left
                                ${form.mood === m.value
                                    ? "bg-pink-500/15 border-pink-500/40 text-pink-600 dark:text-pink-300"
                                    : "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]"
                                }`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Location ── */}
            <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Location (optional)</label>
                <input
                    type="text"
                    value={form.location ?? ""}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Udaipur, Rajasthan"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                />
            </div>

            {/* ── Keywords ── */}
            <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Keywords / Themes (optional, max 6)
                </label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={keywordInput}
                        onChange={e => setKeywordInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                        placeholder="e.g. golden hour, candid, sunset"
                        className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]/50 transition-colors"
                    />
                    <button
                        onClick={addKeyword}
                        className="px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)] transition-colors"
                    >
                        Add
                    </button>
                </div>
                {(form.keywords?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.keywords?.map(kw => (
                            <span
                                key={kw}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded-full"
                            >
                                {kw}
                                <button onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition-colors">×</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Generate */}
            <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 text-white font-semibold hover:from-pink-700 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/20 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[.99]"
            >
                {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Generating Captions...</>
                    : <><Sparkles size={18} /> Generate Captions</>
                }
            </button>

            {/* ── Result ── */}
            {result && (
                <div className="space-y-4 animate-fade-in">
                    {/* Caption Picker */}
                    <div className="flex gap-2">
                        {result.captions.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedCap(i)}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all
                                    ${selectedCap === i
                                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]"
                                        : "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--border-medium)]"
                                    }`}
                            >
                                Caption {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={handleGenerate}
                            className="py-1.5 px-3 text-xs font-semibold rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
                            title="Regenerate"
                        >
                            <RefreshCw size={13} />
                        </button>
                    </div>

                    {/* Selected Caption */}
                    <div className="relative group p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl">
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <CopyButton text={result.captions[selectedCap]} />
                        </div>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap pr-6">
                            {result.captions[selectedCap]}
                        </p>
                    </div>

                    {/* Bio Line */}
                    <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-0.5">Profile Bio Line</p>
                            <p className="text-xs text-[var(--text-primary)]">{result.bio_line}</p>
                        </div>
                        <CopyButton text={result.bio_line} />
                    </div>

                    {/* Hashtags */}
                    {result.hashtags?.length > 0 && (
                        <div className="p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                    <Hash size={12} className="text-[var(--accent-primary)]" />
                                    Hashtags ({result.hashtags.length})
                                </div>
                                <CopyButton text={result.hashtags.join(" ")} />
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {result.hashtags.map((tag, i) => (
                                    <span
                                        key={i}
                                        className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/15"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
