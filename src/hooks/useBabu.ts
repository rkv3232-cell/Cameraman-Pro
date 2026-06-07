import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';
import { sendMessageToBabuStreaming } from '../lib/openrouter';
import { voiceService } from '../lib/voiceService';
import { useBookings } from './useBookings';
import { useInventory } from './useInventory';
import {
    Timestamp
} from 'firebase/firestore';
import {
    detectEquipmentConflicts,
    
    
    generateBookingActions,
    BabuAction,
    BabuContext
} from '../lib/babuIntelligence';
import { format, isToday, isTomorrow } from 'date-fns';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { normalizeFirestoreDate } from '../utils/date';

// ─── Helper ────────────────────────────────────────────────────────────────────
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'hi-IN';
}

const toDate = (timestamp: any): Date => {
    const d = normalizeFirestoreDate(timestamp);
    return d || new Date();
};

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
    userName?: string,
): string {
    const now = new Date();
    const sortedBookings = [...bookings].sort((a, b) => toDate(a.eventDate).getTime() - toDate(b.eventDate).getTime());
    
    const todayBookings = sortedBookings.filter(b => isToday(toDate(b.eventDate)));
    const tomorrowBookings = sortedBookings.filter(b => isTomorrow(toDate(b.eventDate)));
    const upcomingBookings = sortedBookings.filter(b => toDate(b.eventDate) > now && !isToday(toDate(b.eventDate)) && !isTomorrow(toDate(b.eventDate)));
    
    const pendingPayments = bookings.filter(b => (b.financials?.balanceDue ?? 0) > 0);
    const conflicts = detectEquipmentConflicts(bookings);

    const formatBooking = (b: any) =>
        `• **${b.clientName}** — ${b.eventType ?? 'इवेंट'} | ${fmt(b.eventDate)} | बकाया: ${fmtMoney(b.financials?.balanceDue ?? 0)} | स्थिति: ${b.status}`;

    return [
        `स्टूडियो मालिक: ${userName ?? 'बॉस'}`,
        `समय: ${format(now, 'hh:mm a')}`,
        `आज के बुकिंग (${todayBookings.length}):\n${todayBookings.length > 0 ? todayBookings.map(formatBooking).join('\n') : 'कोई नहीं'}`,
        `कल के बुकिंग (${tomorrowBookings.length}):\n${tomorrowBookings.length > 0 ? tomorrowBookings.map(formatBooking).join('\n') : 'कोई नहीं'}`,
        `आगामी बुकिंग (${upcomingBookings.length}):\n${upcomingBookings.length > 0 ? upcomingBookings.slice(0, 50).map(formatBooking).join('\n') : 'कोई नहीं'}`,
        `बकाया भुगतान: ${pendingPayments.length} बुकिंग`,
        `उपकरण टकराव: ${conflicts.length}`
    ].join('\n\n');
}

// ─── Main Hook ─────────────────────────────────────────────────────────────────
export function useBabu() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [context] = useState<ConversationContext>({});
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
    const { bookings, addBooking } = useBookings();
    const { inventory } = useInventory();

    const greetingShownRef = useRef(false);
    
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
            toast.error("वॉइस सपोर्ट उपलब्ध नहीं है।");
            return;
        }
        setIsListening(true);
        recognition.start();
    }, []);

    // ─── 3. LOGIC & INTENT ─────────────────────────────────────────────────────
    const generateAutoGreeting = useCallback(() => {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night';
        const name = userProfile?.name ?? 'बॉस';

        const todayShots = bookings.filter(b => isToday(toDate(b.eventDate)));
        
        let greeting = "";
        if (timeOfDay === 'morning') greeting = `सुप्रभात **${name}**! 🌅`;
        else if (timeOfDay === 'afternoon') greeting = `नमस्ते **${name}**! ☕`;
        else if (timeOfDay === 'evening') greeting = `शुभ संध्या **${name}**! 🌇`;
        else greeting = `बॉस, काफ़ी रात हो गई है। 🌙`;

        let msg = `${greeting}\n\nआज का अपडेट:\n`;
        msg += todayShots.length > 0
            ? todayShots.map(b => `• 📸 **${b.clientName}**`).join('\n')
            : `• आज कोई शूट नहीं है। 😎`;

        const actions: BabuAction[] = [];
        if (todayShots.length > 0) actions.push({ type: 'navigate', label: '📅 आज का शेड्यूल', data: { page: '/calendar' }, style: 'primary' });

        return { message: msg, actions };
    }, [bookings, userProfile]);

    const processLocalIntent = useCallback((text: string, _babuCtx: BabuContext) => {
        const q = text.toLowerCase().trim();

        if (context.lastBookingId && q.match(/(sab|detail|puri|poori|bata|khol|open|show|dekh)/)) {
            const b = bookings.find(x => x.id === context.lastBookingId);
            const fmtMoney = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;
            if (b) return { handled: true, response: `**${b.clientName}** की जानकारी:\n📍 स्थान: ${b.venue}\n📞 फोन: ${b.clientPhone}\n💰 बकाया: ${fmtMoney(b.financials?.balanceDue ?? 0)}`, actions: generateBookingActions(b) };
        }

        if (q.match(/(whatsapp|send|bhejo|bhej|msg|message)/) && context.lastBookingId) {
            const b = bookings.find(x => x.id === context.lastBookingId);
            if (b) {
                sendWhatsAppMessage(b.clientPhone, `नमस्ते ${b.clientName} जी, कैमरामैन प्रो से मैसेज है।`);
                return { handled: true, response: `ठीक है बॉस, **${b.clientName}** को WhatsApp भेज रहा हूँ। ✅`, actions: [] };
            }
        }

        return { handled: false };
    }, [bookings, context]);

    const handleSystemAction = async (fullResponse: string) => {
        const actionMatch = fullResponse.match(/<system_action>([\s\S]*?)<\/system_action>/);
        if (!actionMatch) return;

        try {
            const actionData = JSON.parse(actionMatch[1]);
            console.log("BĀBU System Action detected:", actionData);

            if (actionData.type === 'create_booking') {
                const payload = actionData.payload;
                // Safely convert any date format from AI to Firestore Timestamp
                const parsedDate = normalizeFirestoreDate(payload.eventDate);
                payload.eventDate = parsedDate ? Timestamp.fromDate(parsedDate) : Timestamp.now();
                
                await addBooking(payload);
            } else if (actionData.type === 'send_whatsapp') {
                const { phone, message } = actionData.payload;
                sendWhatsAppMessage(phone, message);
                toast.success("WhatsApp मैसेज भेज दिया गया है!");
            }
        } catch (e) {
            console.error("Error executing BĀBU system action:", e);
        }
    };

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        addMessage('user', text);
        setIsLoading(true);

        const _babuCtx: BabuContext = { bookings, inventory, currentDate: new Date(), userName: userProfile?.name };
        const local = processLocalIntent(text, _babuCtx);

        if (local.handled) {
            setTimeout(() => {
                addMessage('assistant', local.response!, local.actions as BabuAction[]);
                setIsLoading(false);
            }, 250);
            return;
        }

        try {
            const richContext = buildRichContext(bookings, userProfile?.name);
            const history = messagesRef.current.slice(-10).map(m => ({ role: m.role, content: m.content }));
            
            // Create a placeholder message for streaming
            const assistantMsgId = `${Date.now()}-assistant`;
            const placeholderMsg: Message = {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, placeholderMsg]);

            const fullResponse = await sendMessageToBabuStreaming(
                text, 
                richContext, 
                history, 
                (updatedText) => {
                    // Clean up system tags from UI during streaming if possible
                    const cleanText = updatedText.replace(/<system_action>[\s\S]*?<\/system_action>/g, '');
                    setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: cleanText } : m));
                }
            );

            // Execute actual action
            await handleSystemAction(fullResponse);

            // Once finished, handle voice if enabled
            if (voiceActivated && voiceService.isActivated()) {
                const cleanText = fullResponse.replace(/<system_action>[\s\S]*?<\/system_action>/g, '');
                voiceService.speak(cleanText);
            }

        } catch (error) {
            addMessage('assistant', '❌ AI से कनेक्शन में समस्या आई। कृपया दोबारा प्रयास करें।');
        } finally {
            setIsLoading(false);
        }
    }, [bookings, inventory, userProfile, processLocalIntent, addMessage, voiceActivated, addBooking]);

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
