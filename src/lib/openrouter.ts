/// <reference types="vite/client" />
import { BABU_SYSTEM_PROMPT } from './systemPrompt';

/**
 * openrouter.ts — Advanced AI service layer for Cameraman Pro (BĀBU v2)
 * ─────────────────────────────────────────────────────────────────
 * UPDATED: Now using OpenRouter with DeepSeek Chat
 */

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "deepseek/deepseek-chat";

// ─── Helper: OpenRouter API call ───────────────────────────────────────────────
async function fetchOpenRouter(
    messages: { role: string; content: string }[]
): Promise<string> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error("VITE_OPENROUTER_API_KEY is not set.");
    }

    const safeMessages = messages.map(m => ({
        role: m.role,
        content: (m.content ?? "").trim() || "(empty)"
    }));

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Cameraman Pro"
        },
        body: JSON.stringify({
            model: MODEL_ID,
            messages: safeMessages,
            temperature: 0.1,
            max_tokens: 1000,
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
        console.error(`OpenRouter API Error [${response.status}]:`, errorBody);
        throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) throw new Error("OpenRouter returned an empty response.");
    return content.trim();
}

// ─── Export 1: Multi-turn BĀBU Chat ───────────────────────────────────────────
export async function sendMessageToBabu(
    userMessage: string,
    contextInfo?: string,
    history: { role: string; content: string }[] = []
): Promise<string> {
    if (!userMessage?.trim()) {
        return "कृपया कुछ पूछें।";
    }

    const systemContent = contextInfo
        ? `${BABU_SYSTEM_PROMPT}\n\n━━━━━ LIVE STUDIO DATA ━━━━━\n${contextInfo}\n\nUse this data to answer accurately.`
        : BABU_SYSTEM_PROMPT;

    // Build full conversation: system → history → new user message
    const messages = [
        { role: "system", content: systemContent },
        ...history.slice(-10),
        { role: "user", content: userMessage.trim() }
    ];

    try {
        return await fetchOpenRouter(messages);
    } catch (error) {
        console.error("AI Error (sendMessageToBabu):", error);
        throw error;
    }
}

/**
 * NEW: Streaming version of sendMessageToBabu
 * This makes the UI feel instant by showing text as it generates.
 */
export async function sendMessageToBabuStreaming(
    userMessage: string,
    contextInfo: string | undefined,
    history: { role: string; content: string }[],
    onUpdate: (fullText: string) => void
): Promise<string> {
    if (!userMessage?.trim()) return "";
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    
    const systemContent = contextInfo
        ? `${BABU_SYSTEM_PROMPT}\n\n━━━━━ LIVE STUDIO DATA ━━━━━\n${contextInfo}\n\nUse this data to answer accurately.`
        : BABU_SYSTEM_PROMPT;

    const messages = [
        { role: "system", content: systemContent },
        ...history.slice(-10),
        { role: "user", content: userMessage.trim() }
    ];

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Cameraman Pro"
        },
        body: JSON.stringify({
            model: MODEL_ID,
            messages,
            stream: true,
            temperature: 0.1,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter Streaming Error:", response.status, errorText);
        throw new Error(`Streaming failed: ${response.status} ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    if (!reader) throw new Error("No reader available");

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split("\n");
        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === "data: [DONE]") continue;
            
            if (trimmedLine.startsWith("data: ")) {
                const dataStr = trimmedLine.slice(6);
                try {
                    const json = JSON.parse(dataStr);
                    const text = json.choices[0]?.delta?.content || "";
                    if (text) {
                        fullText += text;
                        onUpdate(fullText);
                    }
                } catch (e) {
                    console.warn("Failed to parse JSON chunk:", dataStr);
                }
            }
        }
    }
    return fullText;
}

// ─── Export 2: Generic AI call (AI Tools) ─────────────────────────────────────
export async function callOpenRouter(prompt: string): Promise<string> {
    if (!prompt?.trim()) throw new Error("callOpenRouter: prompt cannot be empty.");

    try {
        return await fetchOpenRouter([{ role: "user", content: prompt.trim() }]);
    } catch (error) {
        console.error("AI Error (callOpenRouter):", error);
        throw error;
    }
}

// ─── Export 3: AI Booking Parser ──────────────────────────────────────────────
export async function parseBookingText(text: string): Promise<any> {
    const prompt = `Extract the following booking details from the text below and return ONLY valid JSON without markdown wrapping or extra text.
Fields to extract (use exactly these keys, set to null if not found):
- clientName (string)
- clientPhone (string)
- eventType (string)
- eventDate (string, YYYY-MM-DD format if possible)
- venue (string)
- advancePaid (number)
- package (string)
- notes (string)

Text:
"""
${text}
"""
`;
    const response = await callOpenRouter(prompt);
    try {
        const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse AI response:", response);
        throw new Error("Failed to parse AI response");
    }
}

// ─── Export 4: AI Booking Image Parser ─────────────────────────────────────────
export async function parseBookingImage(base64Image: string, mimeType: string): Promise<any> {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("VITE_OPENROUTER_API_KEY is not set.");

    const prompt = `Extract the following booking details from this image and return ONLY valid JSON without markdown wrapping or extra text.
Fields to extract (use exactly these keys, set to null if not found):
- clientName (string)
- clientPhone (string)
- eventType (string)
- eventDate (string, YYYY-MM-DD format if possible)
- venue (string)
- advancePaid (number)
- package (string)
- notes (string)`;

    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "Cameraman Pro"
        },
        body: JSON.stringify({
            model: "google/gemini-2.5-pro", // High-quality vision model
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                    ]
                }
            ],
            temperature: 0.1,
            max_tokens: 1000,
        })
    });

    if (!response.ok) {
        throw new Error("Failed to process image");
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) throw new Error("OpenRouter returned an empty response.");

    try {
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse AI response:", content);
        throw new Error("Failed to parse AI response");
    }
}
