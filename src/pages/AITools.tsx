import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QuoteGenerator } from "../components/ai/QuoteGenerator";
import { CaptionGenerator } from "../components/ai/CaptionGenerator";
import { BudgetEstimator } from "../components/ai/BudgetEstimator";
import {
    Sparkles, DollarSign, Instagram, PieChart, ArrowLeft, Zap,
} from "lucide-react";

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "quote" | "caption" | "budget";

const TABS: {
    id: Tab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    gradient: string;        // for panel header (full opacity)
    activeGradient: string;  // for card (softened, JIT-safe concrete classes)
    border: string;
    glow: string;
}[] = [
        {
            id: "quote",
            label: "Quote Generator",
            sublabel: "Auto-price your shoot",
            icon: <DollarSign size={20} />,
            gradient: "from-violet-600 to-indigo-600",
            activeGradient: "from-violet-600/80 to-indigo-600/80",
            border: "border-violet-500/30",
            glow: "shadow-violet-500/20",
        },
        {
            id: "caption",
            label: "Caption Generator",
            sublabel: "Instagram-ready copy",
            icon: <Instagram size={20} />,
            gradient: "from-pink-600 to-rose-500",
            activeGradient: "from-pink-600/80 to-rose-500/80",
            border: "border-pink-500/30",
            glow: "shadow-pink-500/20",
        },
        {
            id: "budget",
            label: "Budget Estimator",
            sublabel: "Know your shoot cost",
            icon: <PieChart size={20} />,
            gradient: "from-emerald-600 to-teal-600",
            activeGradient: "from-emerald-600/80 to-teal-600/80",
            border: "border-emerald-500/30",
            glow: "shadow-emerald-500/20",
        },
    ];

// ─── Page ─────────────────────────────────────────────────────────────────────

export const AITools = () => {
    const navigate = useNavigate();
    const [active, setActive] = useState<Tab>("quote");

    const currentTab = TABS.find(t => t.id === active)!;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">

            {/* ── Header ── */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate("/dashboard")}
                    className="h-10 w-10 flex items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">AI Tools</h1>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500/20 to-indigo-500/20 border border-violet-500/20 text-violet-600 dark:text-violet-300">
                            <Zap size={10} /> Powered by GPT-4o
                        </span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                        AI-powered studio tools — quote, caption & budget in seconds
                    </p>
                </div>
            </div>

            {/* ── Tab Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TABS.map(tab => {
                    const isActive = active === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActive(tab.id)}
                            className={[
                                // layout — identical for all cards
                                "relative overflow-hidden text-left p-5 rounded-xl",
                                "flex flex-col justify-between min-h-[96px]",
                                // consistent decoration
                                "border border-white/10 shadow-lg shadow-purple-900/20",
                                // hover — applies to all including active
                                "hover:scale-[1.02] transition-transform duration-300",
                                // state
                                isActive
                                    ? `bg-gradient-to-r ${tab.activeGradient} text-white`
                                    : "bg-[var(--surface-base)] text-[var(--text-secondary)] hover:shadow-xl",
                            ].join(" ")}
                        >
                            {/* Glow overlay — only rendering difference between active/inactive */}
                            {isActive && (
                                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
                            )}

                            {/* Top: icon */}
                            <div className={[
                                "inline-flex items-center justify-center p-2.5 rounded-xl w-fit",
                                isActive
                                    ? "bg-white/25"
                                    : "bg-[var(--bg-secondary)] border border-[var(--border-light)]",
                            ].join(" ")}>
                                {tab.icon}
                            </div>

                            {/* Bottom: label + sublabel */}
                            <div className="mt-3">
                                <p className="font-bold text-sm leading-snug">{tab.label}</p>
                                <p className={`text-[11px] mt-0.5 ${isActive ? "text-white/70" : "text-[var(--text-tertiary)]"}`}>
                                    {tab.sublabel}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>


            {/* ── Active Panel ── */}
            <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl shadow-sm overflow-hidden">
                {/* Panel Header */}
                <div className={`bg-gradient-to-r ${currentTab.gradient} px-6 py-4 flex items-center gap-3`}>
                    <div className="p-2 rounded-xl bg-white/20">
                        {currentTab.icon}
                    </div>
                    <div>
                        <h2 className="font-bold text-white">{currentTab.label}</h2>
                        <p className="text-white/70 text-xs">{currentTab.sublabel}</p>
                    </div>
                    <Sparkles size={18} className="ml-auto text-white/60 animate-pulse" />
                </div>

                {/* Panel Body */}
                <div className="p-6">
                    {active === "quote" && <QuoteGenerator />}
                    {active === "caption" && <CaptionGenerator />}
                    {active === "budget" && <BudgetEstimator />}
                </div>
            </div>

            {/* ── Disclaimer ── */}
            <p className="text-center text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                AI suggestions are based on Indian market averages. Results may vary.
                Always validate with your own pricing strategy.
                Powered by <span className="font-semibold">Puter.js</span> · Free GPT-4o access.
            </p>
        </div>
    );
};
