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
import { format, isToday } from 'date-fns';
import { sendWhatsAppMessage } from '../utils/whatsapp';

// Helper to convert Timestamp to Date
const toDate = (timestamp: any): Date => {
    return timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
};

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: BabuAction[];
}

/**
 * Context memory for JARVIS-like behavior
 */
interface ConversationContext {
    lastBookingMentioned?: string;
    lastClientMentioned?: string;
    lastTopicMentioned?: string;
    activeBookings?: any[];
    activeAlert?: string;
}

/**
 * BĀBU - Autonomous JARVIS-like AI Agent Hook
 * Speaks first, remembers context, acts proactively
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

    /**
     * AUTO-GREETING: Speak first on dashboard load (JARVIS behavior)
     */
    useEffect(() => {
        // Only greet once on dashboard and when bookings are loaded
        if (
            location.pathname === '/dashboard' &&
            !greetingShownRef.current &&
            bookings.length >= 0 &&
            userProfile?.name
        ) {
            greetingShownRef.current = true;
            setHasGreeted(true);

            // Small delay for natural feel
            setTimeout(() => {
                const greeting = generateAutoGreeting();
                addMessage('assistant', greeting.message, greeting.actions, true);

                // Auto-open chat for first-time greeting
                if (!isOpen) {
                    setIsOpen(true);
                }
            }, 800);
        }
    }, [location.pathname, bookings, userProfile, isOpen]);

    /**
     * VOICE GREETING: Speak auto-greeting when voice is activated
     */
    useEffect(() => {
        if (
            voiceActivated &&
            !voiceGreetingRef.current &&
            hasGreeted &&
            messages.length > 0
        ) {
            voiceGreetingRef.current = true;

            // Speak the first message
            const firstMessage = messages[0];
            if (firstMessage?.role === 'assistant') {
                setTimeout(() => {
                    voiceService.speak(firstMessage.content);
                }, 500);
            }
        }
    }, [voiceActivated, hasGreeted, messages]);

    /**
     * Generate automatic greeting with live data (JARVIS-style)
     */
    const generateAutoGreeting = useCallback(() => {
        const hour = new Date().getHours();
        let timeGreeting = 'शुभ संध्या'; // Evening (default)

        if (hour < 12) timeGreeting = 'सुप्रभात';
        else if (hour < 17) timeGreeting = 'नमस्ते';
        else timeGreeting = 'शुभ संध्या';

        const userName = userProfile?.name || 'Boss';

        // Calculate live stats
        const todayShots = bookings.filter(b => {
            const date = toDate(b.eventDate);
            return isToday(date) && (b.status === 'confirmed' || b.status === 'pending');
        }).length;

        const pendingPayments = findBookingsWithPendingPayment(bookings);
        const totalPending = pendingPayments.reduce((sum, b) => sum + b.financials.balanceDue, 0) / 100;

        const pendingPP = getPendingPostProduction(bookings);
        const editingPending = pendingPP.length;

        const unconfirmedBookings = bookings.filter(b => b.status === 'pending').length;

        const conflicts = detectEquipmentConflicts(bookings);

        let greeting = `${timeGreeting} ${userName} 👋\n\n**आज का स्टूडियो:**\n`;

        if (todayShots > 0) {
            greeting += `• ${todayShots} shoot${todayShots > 1 ? 's' : ''} scheduled\n`;
        } else {
            greeting += `• कोई shoot नहीं है\n`;
        }

        if (totalPending > 0) {
            greeting += `• ₹${Math.floor(totalPending).toLocaleString('en-IN')} pending payment (${pendingPayments.length} bookings)\n`;
        }

        if (editingPending > 0) {
            greeting += `• ${editingPending} editing pending\n`;
        }

        if (unconfirmedBookings > 0) {
            greeting += `• ${unconfirmedBookings} booking confirmation बाकी\n`;
        }

        if (conflicts.length > 0) {
            greeting += `• ⚠️ ${conflicts.length} equipment conflicts!\n`;
        }

        if (todayShots === 0 && totalPending === 0 && editingPending === 0 && unconfirmedBookings === 0) {
            greeting += `\n✅ **सब कुछ ठीक है!**\n`;
        }

        greeting += `\n**बताइए क्या करना है?**`;

        const actions: BabuAction[] = [];

        if (todayShots > 0) {
            actions.push({
                type: 'navigate',
                label: '📅 Today का Schedule',
                data: { page: '/calendar' },
                style: 'primary'
            });
        }

        if (pendingPayments.length > 0) {
            actions.push({
                type: 'navigate',
                label: `💰 Pending Payments (${pendingPayments.length})`,
                data: { page: '/bookings' },
                style: 'secondary'
            });
        }

        if (conflicts.length > 0) {
            actions.push({
                type: 'navigate',
                label: '🚨 Equipment Conflicts',
                data: { page: '/inventory' },
                style: 'danger'
            });
        }

        return { message: greeting, actions };
    }, [bookings, userProfile]);

    /**
     * Process short natural commands (JARVIS-style)
     */
    const processShortCommand = useCallback((text: string): { handled: boolean; response?: string; actions?: BabuAction[] } => {
        const lower = text.toLowerCase().trim();

        // Context-aware commands
        if (context.lastBookingMentioned) {
            const booking = bookings.find(b => b.id === context.lastBookingMentioned);

            if (!booking) {
                return { handled: false };
            }

            // "detail do" / "open kar do" / "dekho" / "show"
            if (lower.match(/^(detail|open|dekh|show|बताओ|खोल)/)) {
                const date = toDate(booking.eventDate);
                return {
                    handled: true,
                    response: `**${booking.clientName}** की booking:\n\n` +
                        `📅 Date: ${format(date, 'dd MMM yyyy')}\n` +
                        `📍 Venue: ${booking.venue}\n` +
                        `💰 Total: ₹${(booking.financials.totalAmount / 100).toLocaleString('en-IN')}\n` +
                        `⚠️ Due: ₹${(booking.financials.balanceDue / 100).toLocaleString('en-IN')}\n`,
                    actions: generateBookingActions(booking)
                };
            }

            // "call kar do" / "phone kar"
            if (lower.match(/^(call|phone|फोन)/)) {
                window.location.href = `tel:${booking.clientPhone}`;
                return {
                    handled: true,
                    response: `📞 Calling ${booking.clientName}...`,
                    actions: []
                };
            }

            // "message bhej do" / "whatsapp"
            if (lower.match(/^(message|whatsapp|msg|भेज)/)) {
                const defaultMsg = `नमस्ते ${booking.clientName} जी,\n\nआपकी booking के बारे में बात करनी थी।\n\nधन्यवाद,\nCameraman Pro`;
                sendWhatsAppMessage(booking.clientPhone, defaultMsg);
                return {
                    handled: true,
                    response: `💬 WhatsApp खोल रहा हूँ ${booking.clientName} के लिए...`,
                    actions: []
                };
            }

            // "confirm kar do" / "haan kar do"
            if (lower.match(/^(confirm|haan|han|yes|ठीक|कर दो)/)) {
                return {
                    handled: true,
                    response: `✅ मैं ${booking.clientName} की booking confirm कर दूँ?\n\n₹${(booking.financials.balanceDue / 100).toLocaleString('en-IN')} pending है।`,
                    actions: [
                        {
                            type: 'update',
                            label: '✅ हाँ, Confirm करो',
                            data: { bookingId: booking.id, action: 'confirm' },
                            style: 'success'
                        },
                        {
                            type: 'navigate',
                            label: '📄 पहले Details देखूँ',
                            data: { page: `/bookings/${booking.id}` },
                            style: 'secondary'
                        }
                    ]
                };
            }
        }

        // General commands without context
        if (lower.match(/^(pending|payment|dues|बाकी)/)) {
            const pending = findBookingsWithPendingPayment(bookings);
            if (pending.length === 0) {
                return {
                    handled: true,
                    response: '✅ कोई pending payment नहीं है!',
                    actions: []
                };
            }

            return {
                handled: true,
                response: `**${pending.length} Pending Payments:**\n\n` +
                    pending.slice(0, 5).map(b =>
                        `• ${b.clientName}: ₹${(b.financials.balanceDue / 100).toLocaleString('en-IN')}`
                    ).join('\n'),
                actions: pending.slice(0, 3).map(b => ({
                    type: 'whatsapp',
                    label: `💬 ${b.clientName}`,
                    data: {
                        phone: b.clientPhone,
                        message: `नमस्ते ${b.clientName} जी,\n\n₹${(b.financials.balanceDue / 100).toLocaleString('en-IN')} का payment pending है।\n\nधन्यवाद`
                    },
                    style: 'success'
                }))
            };
        }

        if (lower.match(/^(आज|today|shoot)/)) {
            const todayShots = bookings.filter(b => {
                const date = toDate(b.eventDate);
                return isToday(date);
            });

            if (todayShots.length === 0) {
                return {
                    handled: true,
                    response: '📅 आज कोई shoot नहीं है। Free day! 🎉',
                    actions: []
                };
            }

            return {
                handled: true,
                response: `**आज की Shoots (${todayShots.length}):**\n\n` +
                    todayShots.map(b =>
                        `• ${b.clientName} - ${b.eventType} @ ${b.venue}`
                    ).join('\n'),
                actions: todayShots.map(b => ({
                    type: 'navigate',
                    label: `📄 ${b.clientName}`,
                    data: { page: `/bookings/${b.id}` },
                    style: 'primary'
                }))
            };
        }

        return { handled: false };
    }, [bookings, context]);

    /**
     * Process user message with context awareness
     */
    const processLocalIntent = useCallback((query: string, babuContext: BabuContext) => {
        const queryLower = query.toLowerCase().trim();

        // First, try short command processing
        const shortCmd = processShortCommand(query);
        if (shortCmd.handled) {
            return {
                handled: true,
                response: shortCmd.response || '',
                actions: shortCmd.actions || []
            };
        }

        // Date-based search
        if (queryLower.match(/(आज|कल|today|tomorrow|\d{1,2})/)) {
            const results = findBookingsByDate(babuContext.bookings, query);

            if (results.length === 0) {
                return {
                    handled: true,
                    response: 'इस date पर कोई booking नहीं है। 📅',
                    actions: []
                };
            }

            if (results.length === 1) {
                const booking = results[0];
                const date = toDate(booking.eventDate);
                const due = booking.financials.balanceDue / 100;

                // Store in context
                setContext(prev => ({
                    ...prev,
                    lastBookingMentioned: booking.id,
                    lastClientMentioned: booking.clientName
                }));

                return {
                    handled: true,
                    response: `**${format(date, 'dd MMM')} की Booking:**\n\n` +
                        `👤 Client: ${booking.clientName}\n` +
                        `📞 Phone: ${booking.clientPhone}\n` +
                        `📍 Venue: ${booking.venue}\n` +
                        `💰 Total: ₹${(booking.financials.totalAmount / 100).toLocaleString('en-IN')}\n` +
                        (due > 0 ? `⚠️ Due: ₹${due.toLocaleString('en-IN')}\n` : '✅ Fully Paid\n'),
                    actions: generateBookingActions(booking)
                };
            }

            // Multiple results
            setContext(prev => ({
                ...prev,
                activeBookings: results
            }));

            return {
                handled: true,
                response: `**${results.length} Bookings Found:**\n\n` +
                    results.map((b, i) =>
                        `${i + 1}. ${b.clientName} - ${b.venue}`
                    ).join('\n') +
                    '\n\n**कौन सी booking चाहिए?**',
                actions: results.map(b => ({
                    type: 'navigate',
                    label: `${b.clientName}`,
                    data: { page: `/bookings/${b.id}` },
                    style: 'primary'
                }))
            };
        }

        // Client search
        if (queryLower.length > 2 && !queryLower.includes('pending')) {
            const clientResults = findBookingsByClient(babuContext.bookings, query);
            if (clientResults.length > 0) {
                const client = clientResults[0];

                setContext(prev => ({
                    ...prev,
                    lastBookingMentioned: client.id,
                    lastClientMentioned: client.clientName
                }));

                const history = analyzeClientHistory(babuContext.bookings, client.clientName);

                return {
                    handled: true,
                    response: history.summary + `\n\n**Latest booking:**\n` +
                        `📅 ${format(toDate(client.eventDate), 'dd MMM yyyy')}\n` +
                        `💰 ₹${(client.financials.balanceDue / 100).toLocaleString('en-IN')} pending`,
                    actions: generateBookingActions(client)
                };
            }
        }

        return { handled: false, response: '', actions: [] };
    }, [processShortCommand]);

    /**
     * Send message to BĀBU
     */
    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        addMessage('user', text);
        setIsLoading(true);

        const babuContext: BabuContext = {
            bookings,
            inventory,
            currentDate: new Date(),
            userName: userProfile?.name,
            userRole: userProfile?.role
        };

        // Try local processing first
        const localResult = processLocalIntent(text, babuContext);

        if (localResult.handled) {
            setTimeout(() => {
                addMessage('assistant', localResult.response, localResult.actions as BabuAction[]);
                setIsLoading(false);
            }, 300);
            return;
        }

        // Fallback to AI with live studio context
        try {
            // Build a concise context string for BĀBU
            const pendingCount = bookings.filter((b: any) => b.status === 'pending').length;
            const todayBookings = bookings.filter((b: any) => {
                const d = b.eventDate?.toDate ? b.eventDate.toDate() : new Date(b.eventDate);
                return d.toDateString() === new Date().toDateString();
            }).length;

            const contextInfo = [
                `User: ${userProfile?.name || 'Studio Owner'} (${userProfile?.role || 'admin'})`,
                `Total bookings: ${bookings.length}`,
                `Pending confirmations: ${pendingCount}`,
                `Today's shoots: ${todayBookings}`,
                `Total equipment items: ${inventory.length}`
            ].join('\n');

            const aiResponse = await sendMessageToBabu(text, contextInfo);
            addMessage('assistant', aiResponse);
        } catch (error: any) {
            toast.error("BĀBU से connect नहीं हो पाया। कृपया फिर से try करें।");
            console.error("AI Error:", error?.message || error);
            addMessage('assistant', '❌ AI server se connect nahi ho pa raha. Thodi der mein try karein.');
        } finally {
            setIsLoading(false);
        }
    }, [bookings, inventory, userProfile, processLocalIntent]);

    /**
     * Add message to chat
     */
    const addMessage = useCallback((role: 'user' | 'assistant', content: string, actions?: BabuAction[], withVoice: boolean = false) => {
        const message: Message = {
            id: Date.now().toString() + Math.random(),
            role,
            content,
            timestamp: new Date(),
            actions
        };
        setMessages(prev => [...prev, message]);

        // Speak assistant messages if voice is activated
        if (role === 'assistant' && (voiceActivated || withVoice) && voiceService.isActivated()) {
            setTimeout(() => {
                voiceService.speak(content);
            }, 100);
        }
    }, [voiceActivated]);

    /**
     * Handle voice activation
     */
    const handleVoiceActivation = useCallback(() => {
        setVoiceActivated(true);
    }, []);

    /**
     * Execute action from BĀBU
     */
    const executeAction = useCallback((action: BabuAction) => {
        switch (action.type) {
            case 'navigate':
                if (action.data?.page) {
                    navigate(action.data.page);
                }
                break;

            case 'whatsapp':
                if (action.data?.phone && action.data?.message) {
                    sendWhatsAppMessage(action.data.phone, action.data.message);
                }
                break;

            case 'call':
                if (action.data?.phone) {
                    window.location.href = `tel:${action.data.phone}`;
                }
                break;

            case 'update':
                // Handle booking updates
                addMessage('assistant', 'मैं इसे update कर रहा हूँ...');
                // TODO: Implement actual update logic
                break;

            default:
                console.warn('Unknown action:', action);
        }
    }, [navigate, addMessage]);

    /**
     * Toggle chat visibility
     */
    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
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
        handleVoiceActivation
    };
}
