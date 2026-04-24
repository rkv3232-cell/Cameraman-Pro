/// <reference types="vite/client" />
import { BABU_SYSTEM_PROMPT } from './systemPrompt';

interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface GeminiResponse {
    candidates: {
        content: {
            parts: { text: string }[];
        };
    }[];
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

export interface BabuResponse {
    text: string;
    metadata?: {
        intent?: string;
        confidence?: number;
        entities?: string[];
        actions_available?: string[];
        requires_confirmation?: boolean;
    };
    ui_components?: {
        type: 'button' | 'link' | 'select' | 'input';
        label: string;
        action?: string;
        style?: 'primary' | 'secondary' | 'danger';
    }[];
}

export async function sendMessageToBabu(
    history: GeminiMessage[],
    newMessage: string,
    context: any
): Promise<BabuResponse> {
    if (!API_KEY) {
        console.warn('VITE_GEMINI_API_KEY not found');
        return { text: "API Key missing. Please check your environment variables." };
    }

    // Construct the full prompt context
    const contextString = `
    CURRENT CONTEXT:
    Time: ${new Date().toISOString()} (IST: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })})
    User Role: ${context.userRole}
    Studio ID: ${context.studioId}
    Current Page: ${context.currentPage}
    
    RECENT DATA SNAPSHOT:
    ${JSON.stringify(context.dataSnapshot, null, 2)}

    IMPORTANT: RESPOND IN JSON FORMAT AS DEFINED IN THE SYSTEM PROMPT.
  `;

    const payload = {
        system_instruction: {
            parts: [
                { text: BABU_SYSTEM_PROMPT },
                { text: "CRITICAL: You are running in a PRODUCTION environment. Strict adherence to safety protocols is required. OUTPUT MUST BE VALID JSON." }
            ]
        },
        contents: [
            ...history,
            {
                role: "user",
                parts: [{ text: `${contextString}\n\nUSER REQUEST: ${newMessage}` }]
            }
        ],
        // Force JSON response (Gemini 1.5 Feature)
        generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data: GeminiResponse = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            const rawText = data.candidates[0].content.parts[0].text;
            try {
                // Attempt to parse JSON
                const parsed = JSON.parse(rawText);
                return parsed as BabuResponse;
            } catch (e) {
                console.warn("Failed to parse BABU JSON:", e);
                // Fallback if model returns plain text
                return { text: rawText };
            }
        } else {
            throw new Error('No candidates returned');
        }

    } catch (error) {
        console.error('Error sending message to BABU:', error);
        return { text: "माफ़ कीजिये, अभी संपर्क नहीं हो पा रहा है. (Network Error)" };
    }
}
