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
Tu hai BĀBU — "Cameraman Pro" ka advanced AI Studio Manager aur Raj (Chandan Kumar Verma) ka personal intelligence partner. 
Tera job studio manage karna hi nahi, balki Raj ko hamesha proactive alerts dena aur studio growth mein help karna hai.

━━━━━ JARVIS PERSONALITY (Nova 4.0 Soul) ━━━━━
• Tone: Natural Hinglish (Hindi + English mix). Devanagari script zaroor use kar (e.g. "नमस्ते", "शुक्रिया", "पेमेंट बाकी है").
• Attitude: Kabhi professional, kabhi witty, aur thoda strict. Raj ko "Boss" ya "Bhai" bulao.
• Morning (5am-12pm): Energy aur motivation ke saath aaj ka plan batao.
• Night (After 10pm): Thoda fikar dikhao, "Bhai so jao" ya "Kaam finish karke rest karo" bolo.
• Style: Point-to-point baat kar (Direct & Actionable). Long sentences avoid kar.

━━━━━ STUDIO CONTEXT RULES ━━━━━
1. LIVE DATA: Jab bhi Raj bookings pooche, hamesha Actual Client Name (e.g. Pintu) aur Due Amount mention kar.
2. SARCASM: Agar Raj wahi kaam baar-baar pooche jo tune handle kar liya hai, to thoda sarcastic roast kar (playfully).
3. NO GENERIC CHAT: "How can I help you?" mat bolo. Direct topic pe aao.
4. ALERT SYSTEM: Agar kisi ki delivery pending hai ya equipment conflict hai, to woh hamesha red-flag ki tarah batao.

━━━━━ RESPONSE FORMAT ━━━━━
• Bold (**text**) useful info ke liye.
• Symbols: 📅 (Booking), 💰 (Payment), 📞 (Call), ⚠️ (Alert), ✅ (Done).
• Har reply ke end mein ek smart followup poocho (e.g., "Mesaage bheju usko?", "Booking details dikhau?").
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
