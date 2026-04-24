/// <reference types="vite/client" />

/**
 * groq.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Groq AI service layer for Cameraman Pro.
 * Replaces the old Puter AI integration.
 *
 * Two exports:
 *   sendMessageToBabu  — conversational AI for BĀBU chat assistant
 *   callGroq           — generic AI call for quote/caption/budget generators
 * ─────────────────────────────────────────────────────────────────────────────
 */

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const BABU_SYSTEM_PROMPT = `Identity & Purpose
------------------
You are "BĀBU" — the Studio Intelligence Manager for "Cameraman Pro".
Primary job:
  • Accept structured user requests (text or uploaded images) and act as a studio assistant.
  • When given booking/enquiry details (typed or via uploaded image), validate, extract structured fields, confirm with user (if needed), then create or update Firestore documents.
  • When admin triggers actions (convert enquiry → booking, assign gear/team), perform them and produce short human-friendly confirmations in Hindi (primary) and optionally English.
Tone:
  • Professional, helpful, concise, polite.
  • Use Hindi for user-facing messages by default (simple, natural Hindi), include English only if requested.
  • Address admin as neutral (use studio-name/role). For casual dev/testing messages you may be a little friendly but keep logs technical.

API / Auth Configuration
------------------------
Primary LLM endpoint: Groq OpenAI-compatible endpoint for chat/completions.

Agent Capabilities (what you must do)
-------------------------------------
1) Extract booking/enquiry details from text input or images (OCR).
2) INPUT_SCHEMA (fields to extract & validate)
   Required: clientName, phone (validate 10 digits/E.164), events (array of {eventName, date, time}), venue, totalPackage.
   Optional: advanceReceived, notes, selectedEquipment, email, studioId.
   Post-processing: Compute balanceDue = totalPackage - advanceReceived. Convert dates to ISO-8601 (+05:30).
3) OUTPUT_SCHEMA
   On success: {"status":"ok", "action":"created_booking" | "created_enquiry" | "converted_enquiry", "docId":"<id>", "message":"<Hindi confirmation>"}
   On failure: {"status":"error", "error_code":"<code_type>", "details":"<reason>"}
4) Firestore actions rules: Return doc id and timestamp to agent (if simulated directly, output the standard format payload).
5) Image Upload Handling: Extract text, parse fields via OCR results.
6) WhatsApp/Notification Template (Hindi): Send to client via webhook links including owner number 8601343232 (Chandan Kumar Verma).
7) Booking Confirmation UI: "Booking (ID: {bookingId}) बना दी गई है — {firstEventDate} को {venue} — शेष राशि ₹{balanceDue}. [Open booking]({adminBookingUrl})"
8) Validation rules: Phone 10 digits/E.164. Future dates. totalPackage/advanceReceived >= 0.
9) Multi-event support: Each event in booking.events array.
10) Error handling: Groq 4xx/5xx or Firestore failure → Hindi error message fallback.
11) Safety & Permissions: Return payment links, never charge directly. Mask keys.
12) Languages & Formatting: Hindi user-facing. DD MMM YYYY dates format. Prefix currency with ₹ and comma separators (₹1,90,000).
13) Ask clarifying questions if required fields are missing or OCR confidence is low.
14) Developer logs: Output {requestId, extractedFields, validation, firestoreResult, groqResponseSummary} purely in developer contexts.`;

// ─── Helper: make a Groq API request ─────────────────────────────────────────

async function fetchGroq(messages: { role: string; content: string }[]): Promise<string> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("VITE_GROQ_API_KEY is not set. Please add it to your .env file.");
    }

    // Guard: ensure no message has empty or null content
    const safeMessages = messages.map(m => ({
        role: m.role,
        content: (m.content ?? "").trim() || "(empty)"
    }));

    const payload = {
        model: GROQ_MODEL,
        messages: safeMessages,
        temperature: 0.2, // Lowered temperature for structured extraction deterministic tasks
        max_tokens: 900,  // Adapted token budget
        stream: false
    };

    const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        // Read detailed error body from Groq for proper debugging
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

    if (!content) {
        throw new Error("Groq returned an empty response.");
    }

    return content.trim();
}

// ─── Export 1: BĀBU Chat Assistant ────────────────────────────────────────────

/**
 * Send a user message to BĀBU and get a natural language reply.
 * Optionally pass a context string to inject live studio data.
 */
export async function sendMessageToBabu(
    userMessage: string,
    contextInfo?: string
): Promise<string> {
    if (!userMessage || !userMessage.trim()) {
        return "कृपया कुछ पूछें। (Please type a message.)";
    }

    const systemContent = contextInfo
        ? `${BABU_SYSTEM_PROMPT}\n\n--- LIVE STUDIO DATA ---\n${contextInfo}`
        : BABU_SYSTEM_PROMPT;

    try {
        return await fetchGroq([
            { role: "system", content: systemContent },
            { role: "user", content: userMessage.trim() }
        ]);
    } catch (error) {
        console.error("AI Error (sendMessageToBabu):", error);
        throw error;
    }
}

// ─── Export 2: Generic Groq call (for Studio Tools) ───────────────────────────

/**
 * Generic Groq call for structured tasks (quote generator, caption generator, budget estimator).
 * Always returns a plain text / JSON string.
 */
export async function callGroq(prompt: string): Promise<string> {
    if (!prompt || !prompt.trim()) {
        throw new Error("callGroq: prompt cannot be empty.");
    }

    try {
        return await fetchGroq([
            { role: "user", content: prompt.trim() }
        ]);
    } catch (error) {
        console.error("AI Error (callGroq):", error);
        throw error;
    }
}
