import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { Send, MessageCircle, X } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { db } from "../../lib/firebase";
import LanguageContext from "../../context/LanguageContext";
import { text } from "../../utils/text";

type ChatMessage = {
    id: string;
    role: "assistant" | "user";
    content: string;
};

const QUESTION_FLOW = [
    { key: "eventType", type: "options" },
    { key: "date", type: "date" },
    { key: "location", type: "text" },
    { key: "name", type: "text" },
    { key: "phone", type: "tel" },
    { key: "message", type: "textarea" },
] as const;

type QuestionKey = (typeof QUESTION_FLOW)[number]["key"];
type CustomerAnswers = Record<QuestionKey, string>;

type SubmitEvent = { preventDefault: () => void };

const EVENT_OPTIONS = [
    { key: "wedding", value: "Wedding" },
    { key: "preWedding", value: "Pre Wedding" },
    { key: "birthday", value: "Birthday" },
    { key: "other", value: "Other" },
] as const;

type EventOption = (typeof EVENT_OPTIONS)[number];

const createMessage = (role: ChatMessage["role"], content: string): ChatMessage => ({
    id: `${role}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`,
    role,
    content,
});

const emptyAnswers: CustomerAnswers = {
    eventType: "",
    date: "",
    location: "",
    name: "",
    phone: "",
    message: "",
};

export function CustomerBabu() {
    const { lang } = useContext(LanguageContext);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<CustomerAnswers>(emptyAnswers);
    const [draft, setDraft] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enquirySent, setEnquirySent] = useState(false);

    const highlightMessage = useMemo(() => {
        const highlights = text.aiCustomer?.serviceHighlights?.[lang] ?? [];
        if (!highlights.length) return "";
        return highlights.map((item: string) => `• ${item}`).join("\n");
    }, [lang]);

    const resetConversation = useCallback(() => {
        const baseMessages: ChatMessage[] = [
            createMessage("assistant", text.aiCustomer.welcome[lang]),
            createMessage("assistant", text.aiCustomer.assistance[lang]),
        ];

        if (highlightMessage) {
            baseMessages.push(createMessage("assistant", highlightMessage));
        }

        baseMessages.push(createMessage("assistant", text.aiCustomer.questions.eventType[lang]));

        setMessages(baseMessages);
        setCurrentQuestionIndex(0);
        setAnswers(emptyAnswers);
        setDraft("");
        setIsTyping(false);
        setIsSubmitting(false);
        setEnquirySent(false);
    }, [lang, highlightMessage]);

    useEffect(() => {
        if (isOpen) {
            resetConversation();
        }
    }, [isOpen, lang, resetConversation]);

    const currentQuestion = QUESTION_FLOW[currentQuestionIndex];
    const isComplete = currentQuestionIndex >= QUESTION_FLOW.length;

    const queueNextAssistantMessage = (nextIndex: number) => {
        setIsTyping(true);
        setTimeout(() => {
            const nextQuestion = QUESTION_FLOW[nextIndex];
            const reply = nextQuestion
                ? text.aiCustomer.questions[nextQuestion.key][lang]
                : text.aiCustomer.confirmation[lang];
            setMessages((prev) => [...prev, createMessage("assistant", reply)]);
            setIsTyping(false);
        }, 450);
    };

    const handleAnswer = (value: string) => {
        if (!currentQuestion) return;
        const displayValue = value || text.aiCustomer.skipped[lang];
        setAnswers((prev) => ({ ...prev, [currentQuestion.key]: value }));
        setDraft("");
        setMessages((prev) => [...prev, createMessage("user", displayValue)]);
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        queueNextAssistantMessage(nextIndex);
    };

    const handleOptionSelect = (option: EventOption) => {
        if (isTyping) return;
        handleAnswer(option.value);
    };

    const validateCurrentInput = (): boolean => {
        if (!currentQuestion) return false;
        const trimmed = draft.trim();
        if (currentQuestion.key === "message") {
            handleAnswer(trimmed);
            return true;
        }

        if (!trimmed) {
            toast.error(text.aiCustomer.errors.missing[lang]);
            return false;
        }

        if (currentQuestion.key === "phone" && !/^[6-9]\d{9}$/.test(trimmed)) {
            toast.error(text.aiCustomer.errors.phone[lang]);
            return false;
        }

        handleAnswer(trimmed);
        return true;
    };

    const handleInputSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        if (!currentQuestion) return;
        validateCurrentInput();
    };

    const handleEnquirySubmit = async () => {
        const requiredFields: (keyof CustomerAnswers)[] = ["eventType", "date", "location", "name", "phone"];
        for (const field of requiredFields) {
            if (!answers[field]) {
                toast.error(text.aiCustomer.errors.missing[lang]);
                return;
            }
        }

        if (!/^[6-9]\d{9}$/.test(answers.phone.trim())) {
            toast.error(text.aiCustomer.errors.phone[lang]);
            return;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, "enquiries"), {
                name: answers.name,
                phone: answers.phone,
                eventType: answers.eventType,
                date: answers.date,
                location: answers.location,
                message: answers.message,
                source: "AI_CHAT",
                status: "new",
                createdAt: serverTimestamp(),
            });
            setEnquirySent(true);
            setMessages((prev) => [...prev, createMessage("assistant", text.aiCustomer.saved[lang])]);
            toast.success(text.aiCustomer.saved[lang]);
        } catch (error) {
            console.error("Error saving AI lead:", error);
            toast.error(text.aiCustomer.errors.network[lang]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

    return (
        <div>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-white/30 bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-xl shadow-indigo-900/50 hover:shadow-purple-900/60"
                aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
            >
                <MessageCircle className="w-5 h-5" />
                {text.aiCustomer.button[lang]}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[320px] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-gray-900 text-white shadow-2xl shadow-black/50 border border-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                        <div>
                            <p className="text-sm uppercase tracking-wider text-indigo-300">AI BABU</p>
                            <p className="text-lg font-semibold">Customer Mode</p>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={resetConversation}
                                className="text-xs text-white/70 hover:text-white"
                            >
                                Restart
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/70 hover:text-white"
                                aria-label="Close chat"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="max-h-[380px] overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-900 to-gray-800">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                    msg.role === "assistant"
                                        ? "bg-white/5 text-white"
                                        : "bg-indigo-600 text-white self-end"
                                }`}
                            >
                                {msg.content.split("\n").map((line, idx) => (
                                    <div key={`${msg.id}-${idx}`}>
                                        {line}
                                    </div>
                                ))}
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex items-center gap-1 rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/70">
                                <span className="h-2 w-2 animate-bounce rounded-full bg-white" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-white delay-150" />
                                <span className="h-2 w-2 animate-bounce rounded-full bg-white delay-300" />
                                <span>{text.aiCustomer.typing[lang]}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-white/10 px-4 pb-4 pt-3">
                        {!isComplete && currentQuestion?.type === "options" && (
                            <div className="grid grid-cols-2 gap-2">
                                {EVENT_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() => handleOptionSelect(option)}
                                        className="rounded-2xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-indigo-400"
                                    >
                                        {text.aiCustomer.eventTypes[option.key][lang]}
                                    </button>
                                ))}
                            </div>
                        )}

                        {!isComplete && currentQuestion?.type !== "options" && (
                            <form onSubmit={handleInputSubmit} className="space-y-2">
                                <label className="text-xs uppercase tracking-wider text-white/70">
                                    {text.aiCustomer.questions[currentQuestion.key][lang]}
                                </label>
                                {currentQuestion.type === "textarea" ? (
                                    <textarea
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        rows={3}
                                        placeholder={text.aiCustomer.placeholders.message[lang]}
                                        className="w-full rounded-2xl bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                ) : (
                                    <input
                                        value={draft}
                                        onChange={(event) => setDraft(event.target.value)}
                                        type={currentQuestion.type}
                                        min={currentQuestion.type === "date" ? minDate : undefined}
                                        placeholder={
                                            text.aiCustomer.placeholders[currentQuestion.key]?.[lang] || ""
                                        }
                                        className="w-full rounded-2xl bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                )}
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 items-center justify-center rounded-2xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                                    >
                                        Next
                                    </button>
                                    {currentQuestion.key === "message" && (
                                        <button
                                            type="button"
                                            onClick={() => handleAnswer("")}
                                            className="text-xs font-semibold text-white/70 hover:text-white"
                                        >
                                            Skip
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}

                        {isComplete && (
                            <div className="space-y-2">
                                <div className="rounded-2xl bg-gray-800 px-3 py-2 text-xs text-white/80">
                                    <p className="font-semibold text-white">Summary</p>
                                    <p>Event: {answers.eventType || "—"}</p>
                                    <p>Date: {answers.date || "—"}</p>
                                    <p>Location: {answers.location || "—"}</p>
                                    <p>Name: {answers.name || "—"}</p>
                                    <p>Phone: {answers.phone || "—"}</p>
                                </div>
                                <button
                                    onClick={handleEnquirySubmit}
                                    disabled={isSubmitting || enquirySent}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Send className="w-4 h-4" />
                                    {enquirySent ? text.aiCustomer.sentLabel[lang] : text.aiCustomer.sendButton[lang]}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
