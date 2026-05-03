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
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN';
}

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
    const pendingPayments = bookings.filter(b => (b.financials?.balanceDue ?? 0) > 0);
    const conflicts = detectEquipmentConflicts(bookings);

    const formatBooking = (b: any) =>
        `• **${b.clientName}** — ${b.eventType ?? 'Event'} | ${fmt(b.eventDate)} | Due: ${fmtMoney(b.financials?.balanceDue ?? 0)} | Status: ${b.status}`;

    return [
        `User: ${userName ?? 'Owner'}`,
        `Time: ${format(now, 'hh:mm a')}`,
        `TODAY (${todayBookings.length}):\n${todayBookings.length > 0 ? todayBookings.map(formatBooking).join('\n') : 'None'}`,
        `TOMORROW (${tomorrowBookings.length}):\n${tomorrowBookings.length > 0 ? tomorrowBookings.map(formatBooking).join('\n') : 'None'}`,
        `PENDING DUES: ${pendingPayments.length} bookings`,
        `CONFLICTS: ${conflicts.length}`
    ].join('\n\n');
}

// ─── Main Hook ─────────────────────────────────────────────────────────────────
export function useBabu() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [context, setContext] = useState<ConversationContext>({});
    const [voiceActivated, setVoiceActivated] = useState(voiceService.isActivated());
    const [isListening, setIsListening] = useState(false);

    // ─── Proactive Notifications (Cloud/Web Native) ────────────────────────────
    const showNotification = useCallback((title: string, body: string) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(title, {
                body,
                icon: '/logo192.png',
                badge: '/logo192.png',
                tag: 'babu-alert'
            });
        }
    }, []);

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const location = useLocation();
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { bookings } = useBookings();
    const { inventory } = useInventory();

    const greetingShownRef = useRef(false);
    const voiceGreetingRef = useRef(false);
    const messagesRef = useRef<Message[]>([]);
    messagesRef.current = messages;

    // ─── 1. CORE UPDATE FUNCTIONS ───────────────────────────────────────────────
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

    // ─── 2. SPEECH CONTROLS ────────────────────────────────────────────────────
    const startVoiceCommand = useCallback(() => {
        if (!recognition) {
            toast.error("Voice support unavailable.");
            return;
        }
        setIsListening(true);
        recognition.start();
    }, []);

    // ─── 3. LOGIC & INTENT ─────────────────────────────────────────────────────
    const generateAutoGreeting = useCallback(() => {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
        const name = userProfile?.name ?? 'Boss';

        const todayShots = bookings.filter(b => isToday(toDate(b.eventDate)));
        const totalPending = findBookingsWithPendingPayment(bookings).reduce((s, b) => s + (b.financials?.balanceDue ?? 0), 0);

        let greeting = "";
        if (timeOfDay === 'morning') greeting = `सुप्रभात **${name}**! 🌅`;
        else if (timeOfDay === 'afternoon') greeting = `नमस्ते **${name}**! ☕`;
        else if (timeOfDay === 'evening') greeting = `शुभ संध्या **${name}**! 🌇`;
        else greeting = `बौस, काफ़ी रात हो गई है। 🌙`;

        let msg = `${greeting}\n\nआज का Update:\n`;
        msg += todayShots.length > 0
            ? todayShots.map(b => `• 📸 **${b.clientName}**`).join('\n')
            : `• आज कोई shoot नहीं है। 😎`;

        const actions: BabuAction[] = [];
        if (todayShots.length > 0) actions.push({ type: 'navigate', label: '📅 Today', data: { page: '/calendar' }, style: 'primary' });

        return { message: msg, actions };
    }, [bookings, userProfile]);

    const processLocalIntent = useCallback((text: string, babuCtx: BabuContext) => {
        const q = text.toLowerCase().trim();

        if (context.lastBookingId && q.match(/(sab|detail|puri|poori|bata|khol|open|show|dekh)/)) {
            const b = bookings.find(x => x.id === context.lastBookingId);
            if (b) return { handled: true, response: `**${b.clientName}** Details:\n📍 ${b.venue}\n📞 ${b.clientPhone}\n💰 Due: ${fmtMoney(b.financials?.balanceDue ?? 0)}`, actions: generateBookingActions(b) };
        }

        if (q.match(/(whatsapp|send|bhejo|bhej|msg|message)/) && context.lastBookingId) {
            const b = bookings.find(x => x.id === context.lastBookingId);
            if (b) {
                sendWhatsAppMessage(b.clientPhone, `नमस्ते ${b.clientName} जी, Cameraman Pro से मेसेज है।`);
                return { handled: true, response: `ठीक है बौस, **${b.clientName}** को WhatsApp भेज रहा हूँ। ✅`, actions: [] };
            }
        }

        return { handled: false };
    }, [bookings, context]);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        addMessage('user', text);
        setIsLoading(true);

        const babuCtx: BabuContext = { bookings, inventory, currentDate: new Date(), userName: userProfile?.name };
        const local = processLocalIntent(text, babuCtx);

        if (local.handled) {
            setTimeout(() => {
                addMessage('assistant', local.response!, local.actions as BabuAction[]);
                setIsLoading(false);
            }, 250);
            return;
        }

        try {
            const richContext = buildRichContext(bookings, inventory, userProfile?.name);
            const history = messagesRef.current.slice(-10).map(m => ({ role: m.role, content: m.content }));
            const aiResponse = await sendMessageToBabu(text, richContext, history);
            addMessage('assistant', aiResponse);
        } catch (error) {
            addMessage('assistant', '❌ AI connection error।');
        } finally {
            setIsLoading(false);
        }
    }, [bookings, inventory, userProfile, processLocalIntent, addMessage]);

    // ─── 4. EFFECTS ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (location.pathname === '/dashboard' && !greetingShownRef.current && userProfile?.name) {
            greetingShownRef.current = true;
            setHasGreeted(true);
            setTimeout(() => {
                const greeting = generateAutoGreeting();
                addMessage('assistant', greeting.message, greeting.actions, true);

                // Proactive Desktop Notification
                showNotification(`BĀBU: ${userProfile.name} बॉस!`, "आज का स्टूडियो अपडेट तैयार है। चेक कर लीजिए। 📸");

                if (!isOpen) setIsOpen(true);
            }, 800);
        }
    }, [location.pathname, userProfile, isOpen, generateAutoGreeting, addMessage, showNotification]);

    useEffect(() => {
        if (recognition) {
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                sendMessage(transcript);
                setIsListening(false);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
        }
    }, [sendMessage]);

    const executeAction = useCallback((action: BabuAction) => {
        if (action.type === 'navigate' && action.data?.page) navigate(action.data.page);
        else if (action.type === 'whatsapp' && action.data?.phone) sendWhatsAppMessage(action.data.phone, action.data.message || '');
        else if (action.type === 'call' && action.data?.phone) window.location.href = `tel:${action.data.phone}`;
    }, [navigate]);

    return {
        isOpen, toggle: () => setIsOpen(prev => !prev),
        messages, sendMessage, isLoading, executeAction,
        hasGreeted, context, voiceActivated, setVoiceActivated,
        handleVoiceActivation: () => setVoiceActivated(true),
        isListening, startVoiceCommand, clearChat: () => setMessages([])
    };
}
