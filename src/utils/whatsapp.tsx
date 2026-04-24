
import { MessageCircle } from "lucide-react";

// Number emoji map for numbered lists
const NUM_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

/**
 * SubEvent shape (matches types/index.ts)
 */
interface MessageSubEvent {
    title: string;
    date: string; // ISO date string e.g. "2026-03-05"
    time: string; // Time string e.g. "13:58"
}

/**
 * Sends a WhatsApp message by opening the wa.me link in a new tab.
 * @param phone Client phone number (can include or exclude country code)
 * @param message The text message to send
 */
export const sendWhatsAppMessage = (phone: string, message: string) => {
    // Remove non-digits and ensure +91 for India
    const cleanPhone = phone.replace(/\D/g, '');
    // Default to 91 if length is 10, otherwise assume full number
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMessage}`, '_blank');
};

export const CUSTOMER_WHATSAPP_EVENT = "cameraman:whatsapp-reply-sent";

interface CustomerWhatsAppPayload {
    name: string;
    phone: string;
    eventType: string;
    date: string;
    location: string;
    message?: string;
}

const formatCustomerDate = (isoDate: string) => {
    if (!isoDate) return "—";
    const parsed = new Date(isoDate);
    if (isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

export const sendWhatsAppReply = (payload: CustomerWhatsAppPayload) => {
    if (!payload.phone) return false;

    const friendlyDate = formatCustomerDate(payload.date);
    const lines = [
        `Hello ${payload.name || "Friend"} 👋`,
        "",
        "Thank you for contacting Cameraman Pro Studio.",
        "",
        "Aapka enquiry mil gaya hai.",
        "",
        `Event Type: ${payload.eventType || "—"}`,
        `Event Date: ${friendlyDate}`,
        `Location: ${payload.location || "—"}`,
    ];

    if (payload.message?.trim()) {
        lines.push("", `Message: ${payload.message.trim()}`);
    }

    lines.push(
        "",
        "Hamari team jaldi hi aapse contact karegi.",
        "",
        "Urgent enquiry ke liye call kare:",
        "",
        "📞 8601343232"
    );

    sendWhatsAppMessage(payload.phone, lines.join("\n"));

    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(CUSTOMER_WHATSAPP_EVENT, { detail: payload }));
    }

    return true;
};

// --- Hindi Message Templates ---

/**
 * Format a single ISO date string (e.g. "2026-03-05") into dd/MM/yyyy
 */
function formatDateStr(isoDate: string): string {
    try {
        const d = new Date(isoDate);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    } catch {
        return isoDate; // Fallback to raw string
    }
}

/**
 * Build formatted events section from SubEvent array.
 * Returns a numbered list string for WhatsApp.
 */
function formatEventsBlock(events: MessageSubEvent[]): string {
    if (!events || events.length === 0) {
        return '📅 कोई कार्यक्रम नहीं';
    }

    return events
        .map((event, idx) => {
            const num = NUM_EMOJIS[idx] || `${idx + 1}.`;
            const dateFormatted = formatDateStr(event.date);
            return `${num} ${event.title}\n   📆 ${dateFormatted}\n   🕒 ${event.time}`;
        })
        .join('\n\n');
}

export const getBookingConfirmationMessage = (
    clientName: string,
    events: MessageSubEvent[],
    total: string,
    advance?: string,
    balance?: string
) => {
    const eventsBlock = formatEventsBlock(events);

    return `नमस्ते ${clientName} जी,

 आपकी बुकिंग सफलतापूर्वक कन्फर्म हो गई है।

 📅 कार्यक्रम विवरण:

 ${eventsBlock}

 💰 कुल पैकेज: ₹${total}
 💵 अग्रिम भुगतान: ₹${advance || "0"}
 📉 शेष राशि: ₹${balance || "0"}

 📞 संपर्क करें:
 8601343232

 Owner:
 Chandan Kumar Verma

 धन्यवाद,
 Cameraman Pro`;
};

export const getPaymentReminderMessage = (clientName: string, dueAmount: string) => {
    return `नमस्ते ${clientName} जी,

 यह रिमाइंडर है कि आपका ₹${dueAmount} बकाया है। कृपया पेमेंट कर दें ताकि हम आपकी सर्विस बेहतर तरीके से दे सकें।

 📞 संपर्क करें:
 8601343232

 धन्यवाद,
 Cameraman Pro`;
};

export const getFollowUpMessage = (clientName: string) => {
    return `नमस्ते ${clientName} जी,

 क्या आप फोटोशूट के लिए तैयार हैं? कृपया कन्फर्म करें।

 📞 संपर्क करें:
 8601343232

 धन्यवाद,
 Cameraman Pro`;
};

// --- React Component ---

interface WhatsAppButtonProps {
    phone: string;
    message: string;
    label?: string;
    iconSize?: number;
    className?: string; // Allow custom styling injection
}

export const WhatsAppButton = ({ phone, message, label = "WhatsApp", iconSize = 16, className }: WhatsAppButtonProps) => (
    <button
        onClick={(e) => {
            e.stopPropagation(); // Prevent row click
            sendWhatsAppMessage(phone, message);
        }}
        className={className || "flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"}
        title="Send WhatsApp Message"
    >
        <MessageCircle size={iconSize} />
        {label && <span>{label}</span>}
    </button>
);
