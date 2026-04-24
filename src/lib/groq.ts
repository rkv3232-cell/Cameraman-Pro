/// <reference types="vite/client" />

/**
 * groq.ts — Advanced AI service layer for Cameraman Pro (BĀBU v2)
 * ─────────────────────────────────────────────────────────────────
 * Improvements:
 *   • Multi-turn conversation history (no more context loss)
 *   • Rich system prompt — always shows actual data, not just counts
 *   • Shorter, actionable replies in natural Hindi
 *   • No self-introduction loop
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ─── Advanced System Prompt ────────────────────────────────────────────────────
export const BABU_SYSTEM_PROMPT = `
तुम "BĀBU" हो — Cameraman Pro Studio का AI Manager।
Owner: Chandan Kumar Verma (8601343232)।

━━━━━ PERSONALITY ━━━━━
• छोटे, काम के जवाब दो। फालतू लम्बी बात मत करो।
• खुद का परिचय बार-बार मत दो। सिर्फ पहली बार।
• हिंदी में बोलो (simple Hinglish OK)।
• "क्या मैं आपकी सहायता कर सकता हूँ?" जैसी generic lines मत बोलो।
• हर जवाब के अंत में एक छोटा काम बताओ जो owner को करना है।

━━━━━ CRITICAL RULES ━━━━━
1. जब भी user "booking", "aaj ki", "kal ki", "pending", etc. पूछे — LIVE STUDIO DATA से actual names, dates, venues, amounts निकालो और दिखाओ।
   ❌ Wrong: "आज 1 shooting है। कौन सी जानकारी चाहिए?"
   ✅ Right: "आज की booking: Pintu Sharma — Wedding @ Hotel Grand, 6:44 PM। ₹20,000 due।"

2. पिछली बातचीत याद रखो। अगर user ने किसी booking के बारे में बात की है, तो वही context use करो।
   ❌ Wrong: User "sab" पूछे तो परिचय देना शुरू मत करो।
   ✅ Right: "आज की पूरी booking details: [data]"

3. हर जवाब में जहाँ ज़रूरी हो, ये suggest करो:
   → 📞 Call करें | 💬 WhatsApp | 📄 Booking खोलें

4. Numbers को ₹ format में लिखो: ₹1,20,000
   Dates: 24 Apr 2026 format में।

5. अगर कोई data नहीं मिला, तो honestly बोलो: "इस नाम/date की कोई booking नहीं मिली।"

━━━━━ RESPONSE FORMAT ━━━━━
• Max 150 words per reply।
• Bullet points use करो जब multiple items हों।
• Bold (**text**) important info के लिए।
• Emoji use करो जहाँ natural लगे — 📅 💰 📞 ✅ ⚠️
`;

// ─── Helper: Groq API call ─────────────────────────────────────────────────────
async function fetchGroq(
    messages: { role: string; content: string }[]
): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("VITE_GROQ_API_KEY is not set.");
    }

    const safeMessages = messages.map(m => ({
        role: m.role,
        content: (m.content ?? "").trim() || "(empty)"
    }));

    const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: safeMessages,
            temperature: 0.4,
            max_tokens: 600,
            stream: false
        })
    });

    if (!response.ok) {
        let errorBody = "";
        try {
            const errJson = await response.json();
            errorBody = errJson?.error?.message ?? JSON.stringify(errJson);
        } catch {
            errorBody = await response.text();
        }
        console.error(`Groq API Error [${response.status}]:`, errorBody);
        throw new Error(`Groq API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) throw new Error("Groq returned an empty response.");
    return content.trim();
}

// ─── Export 1: Multi-turn BĀBU Chat ───────────────────────────────────────────
/**
 * Send a full conversation history to BĀBU along with live context.
 * history = [{role: 'user'|'assistant', content: '...'}]
 */
export async function sendMessageToBabu(
    userMessage: string,
    contextInfo?: string,
    history: { role: string; content: string }[] = []
): Promise<string> {
    if (!userMessage?.trim()) {
        return "कृपया कुछ पूछें।";
    }

    const systemContent = contextInfo
        ? `${BABU_SYSTEM_PROMPT}\n\n━━━━━ LIVE STUDIO DATA (अभी का real data) ━━━━━\n${contextInfo}\n\nइसी data को use करके जवाब दो।`
        : BABU_SYSTEM_PROMPT;

    // Build full conversation: system → history → new user message
    const messages = [
        { role: "system", content: systemContent },
        // Keep last 10 exchanges to avoid token overflow
        ...history.slice(-10),
        { role: "user", content: userMessage.trim() }
    ];

    try {
        return await fetchGroq(messages);
    } catch (error) {
        console.error("AI Error (sendMessageToBabu):", error);
        throw error;
    }
}

// ─── Export 2: Generic Groq call (AI Tools) ───────────────────────────────────
export async function callGroq(prompt: string): Promise<string> {
    if (!prompt?.trim()) throw new Error("callGroq: prompt cannot be empty.");

    try {
        return await fetchGroq([{ role: "user", content: prompt.trim() }]);
    } catch (error) {
        console.error("AI Error (callGroq):", error);
        throw error;
    }
}
