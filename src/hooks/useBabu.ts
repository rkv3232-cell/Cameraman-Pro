import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';
import { sendMessageToBabu } from '../lib/groq';
import { voiceService } from '../lib/voiceService';
import { useBookings } from './useBookings';
import { useInventory } from './useInventory';
import {
    findBookingsByDate,
    findBookingsByClient,
    findBookingsWithPendingPayment,
    detectEquipmentConflicts,
    getPendingPostProduction,
    analyzeClientHistory,
    generateBookingActions,
    BabuAction,
    BabuContext
} from '../lib/babuIntelligence';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { sendWhatsAppMessage } from '../utils/whatsapp';

// ─── Helper ────────────────────────────────────────────────────────────────────
const toDate = (timestamp: any): Date =>
    timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

const fmt = (d: any) => format(toDate(d), 'dd MMM yyyy');
const fmtMoney = (paise: number) =>
    `₹${(paise / 100).toLocaleString('en-IN')}`;

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: BabuAction[];
}

interface ConversationContext {
    lastBookingId?: string;
    lastClientName?: string;
    lastTopic?: string;
    activeBookings?: any[];
}

// ─── Build rich context string for AI ─────────────────────────────────────────
function buildRichContext(
    bookings: any[],
    inventory: any[],
    userName?: string,
    userRole?: string
): string {
    const now = new Date();

    const todayBookings = bookings.filter(b => isToday(toDate(b.eventDate)));
    const tomorrowBookings = bookings.filter(b => isTomorrow(toDate(b.eventDate)));
    const pendingConfirm = bookings.filter(b => b.status === 'pending');
    const pendingPayments = bookings.filter(b =>
        (b.financials?.balanceDue ?? 0) > 0
    );
    const conflicts = detectEquipmentConflicts(bookings);

    const formatBooking = (b: any) =>
        `• **${b.clientName}** (${b.clientPhone}) — ${b.eventType ?? 'Event'} @ ${b.venue} | ${fmt(b.eventDate)} | Total: ${fmtMoney(b.financials?.totalAmount ?? 0)} | Due: ${fmtMoney(b.financials?.balanceDue ?? 0)} | Status: ${b.status}`;

    const lines = [
        `User: ${userName ?? 'Owner'} (${userRole ?? 'admin'})`,
        `Date/Time: ${format(now, 'dd MMM yyyy, hh:mm a')}`,
        `Total bookings: ${bookings.length}`,
        ``,
        `📅 TODAY's bookings (${todayBookings.length}):`,
        todayBookings.length > 0
            ? todayBookings.map(formatBooking).join('\n')
            : 'कोई shoot नहीं है।',
        ``,
        `📅 TOMORROW's bookings (${tomorrowBookings.length}):`,
        tomorrowBookings.length > 0
            ? tomorrowBookings.slice(0, 5).map(formatBooking).join('\n')
            : 'कोई booking नहीं।',
        ``,
        `⏳ PENDING confirmation (${pendingConfirm.length}):`,
        pendingConfirm.length > 0
            ? pendingConfirm.slice(0, 5).map(formatBooking).join('\n')
            : 'कोई नहीं।',
        ``,
        `💰 PENDING payments (${pendingPayments.length}):`,
        pendingPayments.length > 0
            ? pendingPayments.slice(0, 5).map(b =>
                `• ${b.clientName}: ${fmtMoney(b.financials?.balanceDue ?? 0)} due`
            ).join('\n')
            : 'कोई नहीं।',
        ``,
        `⚠️ Equipment conflicts: ${conflicts.length}`,
        `📦 Inventory items: ${inventory.length}`,
        ``,
        `ALL RECENT BOOKINGS (last 8):`,
        bookings
            .slice()
            .sort((a, b) => toDate(b.eventDate).getTime() - toDate(a.eventDate).getTime())
            .slice(0, 8)
            .map(formatBooking).join('\n'),
    ];

    return lines.join('\n');
}

// ─── Main Hook ─────────────────────────────────────────────────────────────────
/**
 * BĀBU v2 — Advanced JARVIS-like AI Agent Hook
 * • Multi-turn conversation history
 * • Rich real-time context
 * • Smarter local intent detection with actual data
 * • No more context loss or generic loops
 */
export function useBabu() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [context, setContext] = useState<ConversationContext>({});
    const [voiceActivated, setVoiceActivated] = useState(voiceService.isActivated());

    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { bookings } = useBookings();
    const { inventory } = useInventory();

    const greetingShownRef = useRef(false);
    const voiceGreetingRef = useRef(false);
    // Keep a ref of messages for use inside callbacks without stale closure
    const messagesRef = useRef<Message[]>([]);
    messagesRef.current = messages;

    // ─── AUTO-GREETING ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (
            location.pathname === '/dashboard' &&
            !greetingShownRef.current &&
            bookings.length >= 0 &&
            userProfile?.name
        ) {
            greetingShownRef.current = true;
            setHasGreeted(true);

            setTimeout(() => {
                const greeting = generateAutoGreeting();
                addMessage('assistant', greeting.message, greeting.actions, true);
                if (!isOpen) setIsOpen(true);
            }, 800);
        }
    }, [location.pathname, bookings, userProfile, isOpen]);

    // ─── VOICE GREETING ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (voiceActivated && !voiceGreetingRef.current && hasGreeted && messages.length > 0) {
            voiceGreetingRef.current = true;
            const first = messages[0];
            if (first?.role === 'assistant') {
                setTimeout(() => voiceService.speak(first.content), 500);
            }
        }
    }, [voiceActivated, hasGreeted, messages]);

    // ─── SMART AUTO-GREETING with actual data ──────────────────────────────────
    const generateAutoGreeting = useCallback(() => {
        const hour = new Date().getHours();
        const salutation = hour < 12 ? 'सुप्रभात' : hour < 17 ? 'नमस्ते' : 'शुभ संध्या';
        const name = userProfile?.name ?? 'Boss';

        const todayShots = bookings.filter(b => isToday(toDate(b.eventDate)));
        const pendingPayments = findBookingsWithPendingPayment(bookings);
        const totalPending = pendingPayments.reduce((s, b) => s + (b.financials?.balanceDue ?? 0), 0);
        const unconfirmed = bookings.filter(b => b.status === 'pending');
        const conflicts = detectEquipmentConflicts(bookings);
        const pendingPP = getPendingPostProduction(bookings);

        let msg = `${salutation} **${name}** 👋\n\n**आज का स्टूडियो:**\n`;

        if (todayShots.length > 0) {
            msg += todayShots.map(b =>
                `• 📅 ${b.clientName} — ${b.eventType ?? 'Shoot'} @ ${b.venue}`
            ).join('\n') + '\n';
        } else {
            msg += `• कोई shoot नहीं है\n`;
        }

        if (totalPending > 0) {
            msg += `• 💰 ${fmtMoney(totalPending)} pending (${pendingPayments.length} bookings)\n`;
        }
        if (unconfirmed.length > 0) {
            msg += `• ⏳ ${unconfirmed.length} booking confirmation बाकी\n`;
        }
        if (pendingPP.length > 0) {
            msg += `• 🎬 ${pendingPP.length} editing pending\n`;
        }
        if (conflicts.length > 0) {
            msg += `• ⚠️ ${conflicts.length} equipment conflict!\n`;
        }

        if (todayShots.length === 0 && totalPending === 0 && unconfirmed.length === 0) {
            msg += `\n✅ **सब कुछ ठीक है!**\n`;
        }

        msg += `\n**बताइए क्या करना है?**`;

        const actions: BabuAction[] = [];
        if (todayShots.length > 0) {
            actions.push({ type: 'navigate', label: '📅 Today का Schedule', data: { page: '/calendar' }, style: 'primary' });
        }
        if (pendingPayments.length > 0) {
            actions.push({ type: 'navigate', label: `💰 Pending Payments (${pendingPayments.length})`, data: { page: '/bookings' }, style: 'secondary' });
        }
        if (conflicts.length > 0) {
            actions.push({ type: 'navigate', label: '🚨 Equipment Conflicts', data: { page: '/inventory' }, style: 'danger' });
        }

        return { message: msg, actions };
    }, [bookings, userProfile]);

    // ─── SMART LOCAL INTENT DETECTION ──────────────────────────────────────────
    const processLocalIntent = useCallback((text: string, babuCtx: BabuContext): {
        handled: boolean; response?: string; actions?: BabuAction[]
    } => {
        const q = text.toLowerCase().trim();

        // ── If user says "sab", "details", "puri", etc after a booking was mentioned ──
        if (context.lastBookingId && q.match(/^(sab|detail|puri|poori|bata|khol|open|show|dekh)/)) {
            const b = bookings.find(x => x.id === context.lastBookingId);
            if (b) {
                const due = b.financials?.balanceDue ?? 0;
                return {
                    handled: true,
                    response:
                        `**${b.clientName}** की पूरी booking:\n\n` +
                        `📅 Date: ${fmt(b.eventDate)}\n` +
                        `📍 Venue: ${b.venue}\n` +
                        `📞 Phone: ${b.clientPhone}\n` +
                        `🎬 Event: ${b.eventType ?? 'N/A'}\n` +
                        `💰 Total: ${fmtMoney(b.financials?.totalAmount ?? 0)}\n` +
                        (due > 0 ? `⚠️ Due: ${fmtMoney(due)}\n` : `✅ Fully Paid\n`) +
                        `📋 Status: ${b.status}`,
                    actions: generateBookingActions(b)
                };
            }
        }

        // ── Context: call/whatsapp after a booking mentioned ──
        if (context.lastBookingId) {
            const b = bookings.find(x => x.id === context.lastBookingId);
            if (b) {
                if (q.match(/^(call|phone|फोन|bol)/)) {
                    window.location.href = `tel:${b.clientPhone}`;
                    return { handled: true, response: `📞 ${b.clientName} को call कर रहा हूँ...`, actions: [] };
                }
                if (q.match(/^(whatsapp|msg|message|bhej|bhejo|wa)/)) {
                    sendWhatsAppMessage(b.clientPhone, `नमस्ते ${b.clientName} जी,\n\nCameraman Pro की तरफ से संपर्क कर रहे हैं।\n\nधन्यवाद`);
                    return { handled: true, response: `💬 ${b.clientName} को WhatsApp भेज रहा हूँ...`, actions: [] };
                }
            }
        }

        // ── "Aaj ki" — show today's bookings with full details ──
        if (q.match(/(aaj|आज|today)/)) {
            const today = bookings.filter(b => isToday(toDate(b.eventDate)));
            if (today.length === 0) {
                return { handled: true, response: '📅 आज कोई shoot नहीं है। Free day! 🎉', actions: [{ type: 'navigate', label: '📅 Calendar देखें', data: { page: '/calendar' }, style: 'secondary' }] };
            }
            const resp = `**आज की ${today.length} Booking(s):**\n\n` +
                today.map(b => {
                    const due = b.financials?.balanceDue ?? 0;
                    return `📅 **${b.clientName}** — ${b.eventType ?? 'Shoot'}\n   📍 ${b.venue}\n   📞 ${b.clientPhone}\n   ${due > 0 ? `⚠️ Due: ${fmtMoney(due)}` : '✅ Paid'}`;
                }).join('\n\n');

            if (today.length === 1) {
                setContext(prev => ({ ...prev, lastBookingId: today[0].id, lastClientName: today[0].clientName }));
            }
            return {
                handled: true,
                response: resp,
                actions: today.map(b => ({ type: 'navigate' as const, label: `📄 ${b.clientName}`, data: { page: `/bookings/${b.id}` }, style: 'primary' as const }))
            };
        }

        // ── "Kal ki" — tomorrow ──
        if (q.match(/(kal|कल|tomorrow)/)) {
            const tmrw = bookings.filter(b => isTomorrow(toDate(b.eventDate)));
            if (tmrw.length === 0) {
                return { handled: true, response: '📅 कल कोई booking नहीं है।', actions: [] };
            }
            const resp = `**कल की ${tmrw.length} Booking(s):**\n\n` +
                tmrw.map(b =>
                    `📅 **${b.clientName}** — ${b.eventType ?? 'Shoot'} @ ${b.venue}\n   Due: ${fmtMoney(b.financials?.balanceDue ?? 0)}`
                ).join('\n\n');
            return {
                handled: true,
                response: resp,
                actions: tmrw.map(b => ({ type: 'navigate' as const, label: `📄 ${b.clientName}`, data: { page: `/bookings/${b.id}` }, style: 'primary' as const }))
            };
        }

        // ── Pending payments ──
        if (q.match(/(pending|payment|dues|baki|bakaya|बाकी|पेमेंट)/)) {
            const pending = findBookingsWithPendingPayment(bookings);
            if (pending.length === 0) return { handled: true, response: '✅ कोई pending payment नहीं है!', actions: [] };
            const total = pending.reduce((s, b) => s + (b.financials?.balanceDue ?? 0), 0);
            const resp = `**${pending.length} Pending Payments — Total ${fmtMoney(total)}:**\n\n` +
                pending.slice(0, 5).map(b =>
                    `• **${b.clientName}**: ${fmtMoney(b.financials?.balanceDue ?? 0)}`
                ).join('\n');
            return {
                handled: true,
                response: resp,
                actions: pending.slice(0, 3).map(b => ({
                    type: 'whatsapp' as const,
                    label: `💬 ${b.clientName}`,
                    data: { phone: b.clientPhone, message: `नमस्ते ${b.clientName} जी,\n₹${(b.financials?.balanceDue ?? 0) / 100} का payment pending है।` },
                    style: 'success' as const
                }))
            };
        }

        // ── Unconfirmed / pending confirmations ──
        if (q.match(/(unconfirmed|confirm|pending booking|confir|कन्फर्म)/)) {
            const unconf = bookings.filter(b => b.status === 'pending');
            if (unconf.length === 0) return { handled: true, response: '✅ सभी bookings confirm हैं!', actions: [] };
            const resp = `**${unconf.length} Unconfirmed Bookings:**\n\n` +
                unconf.slice(0, 5).map(b =>
                    `• **${b.clientName}** — ${fmt(b.eventDate)} @ ${b.venue}`
                ).join('\n');
            return {
                handled: true,
                response: resp,
                actions: unconf.slice(0, 3).map(b => ({ type: 'navigate' as const, label: `📄 ${b.clientName}`, data: { page: `/bookings/${b.id}` }, style: 'primary' as const }))
            };
        }

        // ── Client name search ──
        if (q.length > 2 && !q.match(/(pending|payment|aaj|kal|today|tomorrow)/)) {
            const results = findBookingsByClient(babuCtx.bookings, text);
            if (results.length > 0) {
                const client = results[0];
                setContext(prev => ({ ...prev, lastBookingId: client.id, lastClientName: client.clientName }));
                const history = analyzeClientHistory(babuCtx.bookings, client.clientName);
                const due = client.financials?.balanceDue ?? 0;
                return {
                    handled: true,
                    response:
                        `${history.summary}\n\n` +
                        `**Latest booking:**\n` +
                        `📅 ${fmt(client.eventDate)} @ ${client.venue}\n` +
                        `💰 ${fmtMoney(client.financials?.totalAmount ?? 0)} | ` +
                        (due > 0 ? `⚠️ ${fmtMoney(due)} due` : `✅ Paid`),
                    actions: generateBookingActions(client)
                };
            }
        }

        return { handled: false };
    }, [bookings, context]);

    // ─── SEND MESSAGE ───────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        addMessage('user', text);
        setIsLoading(true);

        const babuCtx: BabuContext = {
            bookings,
            inventory,
            currentDate: new Date(),
            userName: userProfile?.name,
            userRole: userProfile?.role
        };

        // Try fast local handling first
        const local = processLocalIntent(text, babuCtx);
        if (local.handled) {
            setTimeout(() => {
                addMessage('assistant', local.response!, local.actions as BabuAction[]);
                setIsLoading(false);
            }, 250);
            return;
        }

        // Fallback to Groq AI with full context + conversation history
        try {
            const richContext = buildRichContext(bookings, inventory, userProfile?.name, userProfile?.role);

            // Build conversation history from messages (exclude greeting for brevity)
            const history = messagesRef.current
                .filter(m => m.role === 'user' || m.role === 'assistant')
                .slice(-12) // last 6 exchanges
                .map(m => ({ role: m.role, content: m.content }));

            const aiResponse = await sendMessageToBabu(text, richContext, history);
            addMessage('assistant', aiResponse);
        } catch (error: any) {
            toast.error("BĀBU से connect नहीं हो पाया।");
            console.error("AI Error:", error?.message ?? error);
            addMessage('assistant', '❌ AI server से connect नहीं हो पाया। थोड़ी देर में try करें।');
        } finally {
            setIsLoading(false);
        }
    }, [bookings, inventory, userProfile, processLocalIntent]);

    // ─── ADD MESSAGE ────────────────────────────────────────────────────────────
    const addMessage = useCallback((
        role: 'user' | 'assistant',
        content: string,
        actions?: BabuAction[],
        withVoice: boolean = false
    ) => {
        const msg: Message = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            role,
            content,
            timestamp: new Date(),
            actions
        };
        setMessages(prev => [...prev, msg]);

        if (role === 'assistant' && (voiceActivated || withVoice) && voiceService.isActivated()) {
            setTimeout(() => voiceService.speak(content), 100);
        }
    }, [voiceActivated]);

    // ─── EXECUTE ACTION ─────────────────────────────────────────────────────────
    const executeAction = useCallback((action: BabuAction) => {
        switch (action.type) {
            case 'navigate':
                if (action.data?.page) navigate(action.data.page);
                break;
            case 'whatsapp':
                if (action.data?.phone && action.data?.message)
                    sendWhatsAppMessage(action.data.phone, action.data.message);
                break;
            case 'call':
                if (action.data?.phone)
                    window.location.href = `tel:${action.data.phone}`;
                break;
            case 'update':
                addMessage('assistant', 'अभी इसे update kar raha hun...');
                break;
            default:
                console.warn('Unknown action:', action);
        }
    }, [navigate, addMessage]);

    const toggle = useCallback(() => setIsOpen(prev => !prev), []);
    const handleVoiceActivation = useCallback(() => setVoiceActivated(true), []);
    const clearChat = useCallback(() => {
        setMessages([]);
        greetingShownRef.current = false;
        setHasGreeted(false);
        setContext({});
    }, []);

    return {
        isOpen,
        toggle,
        messages,
        sendMessage,
        isLoading,
        executeAction,
        hasGreeted,
        context,
        voiceActivated,
        handleVoiceActivation,
        clearChat
    };
}
