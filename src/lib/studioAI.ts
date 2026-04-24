/**
 * studioAI.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Modular AI service layer for Cameraman Pro.
 * All calls to Puter.js (free GPT-4o-mini) are isolated here.
 * UI components NEVER call window.puter directly.
 *
 * Three capabilities:
 *   1. generateQuote       — suggests a pricing package
 *   2. generateCaption     — Instagram caption + hashtags
 *   3. estimateBudget      — expense breakdown for a shoot
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Shared Groq helper ──────────────────────────────────────────────────────
import { callGroq } from './groq';

/** Strip markdown code fences and extract JSON object */
function extractJSON(raw: string): any {
    let text = raw.trim();
    // Remove ```json ... ``` fences
    text = text.replace(/^```json\s*\n?/, "").replace(/\n?```$/, "");
    text = text.replace(/^```\s*\n?/, "").replace(/\n?```$/, "");
    // Find first { ... }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Could not parse JSON from AI response");
}

// ─── 1. Auto Quote Generator ──────────────────────────────────────────────────

export interface QuoteInput {
    eventType: string;   // e.g. "Wedding"
    numberOfDays: number;   // 1–7
    equipmentList: string[]; // ["DSLR Camera", "Drone", "LED Panel"]
    teamSize: number;   // 1–10
}

export interface QuoteResult {
    suggestedPrice: number;   // INR
    priceRange: { min: number; max: number };
    breakdown: { label: string; amount: number }[];
    rationale: string;
    tips: string[];
}

export async function generateQuote(input: QuoteInput): Promise<QuoteResult> {
    const prompt = `You are an expert photography studio pricing consultant in India.
A client wants a quote for the following shoot:
- Event Type: ${input.eventType}
- Number of Days: ${input.numberOfDays}
- Equipment Required: ${input.equipmentList.join(", ") || "Standard camera setup"}
- Team Size: ${input.teamSize} people

Generate a professional pricing quote in Indian Rupees (INR).
Consider typical Indian market rates for photography/videography.
Base rates per day by event: Wedding ₹25,000-80,000, Pre-wedding ₹15,000-40,000, Corporate ₹20,000-50,000, Birthday ₹8,000-20,000.

Return ONLY valid JSON in this exact structure:
{
  "suggestedPrice": 45000,
  "priceRange": { "min": 38000, "max": 52000 },
  "breakdown": [
    { "label": "Photography (${input.numberOfDays} day)", "amount": 30000 },
    { "label": "Equipment charges", "amount": 5000 },
    { "label": "Team (${input.teamSize} members)", "amount": 10000 }
  ],
  "rationale": "Brief 1-sentence explanation",
  "tips": ["Tip 1 for better deal", "Tip 2"]
}`;

    const raw = await callGroq(prompt);
    const parsed = extractJSON(raw);
    return parsed as QuoteResult;
}

// ─── 2. Instagram Caption Generator ──────────────────────────────────────────

export interface CaptionInput {
    eventType: string;   // e.g. "Wedding"
    mood?: string;   // e.g. "romantic", "fun", "elegant"
    location?: string;   // e.g. "Udaipur, Rajasthan"
    keywords?: string[]; // e.g. ["sunset", "candid", "golden hour"]
}

export interface CaptionResult {
    captions: string[];   // 3 variations
    hashtags: string[];   // 20-30 relevant tags
    bio_line: string;     // short studio bio line
}

export async function generateCaption(input: CaptionInput): Promise<CaptionResult> {
    const prompt = `You are a professional social media content creator specializing in photography studios.
Create Instagram content for a ${input.eventType} photography post.
${input.mood ? `Mood/Vibe: ${input.mood}` : ""}
${input.location ? `Location: ${input.location}` : ""}
${input.keywords?.length ? `Key themes: ${input.keywords.join(", ")}` : ""}

Generate 3 unique, engaging Instagram captions with emojis. Each should be 2-4 sentences.
Also generate 25 relevant hashtags.

Return ONLY valid JSON in this exact structure:
{
  "captions": [
    "Caption 1 with emojis ✨",
    "Caption 2 with emojis 📸",  
    "Caption 3 with emojis 💍"
  ],
  "hashtags": ["#wedding", "#photography", "#weddingphotography"],
  "bio_line": "📸 Capturing your most precious moments | DM to book"
}`;

    const raw = await callGroq(prompt);
    const parsed = extractJSON(raw);
    return parsed as CaptionResult;
}

// ─── 3. AI Budget Estimator ───────────────────────────────────────────────────

export interface BudgetInput {
    eventType: string;
    numberOfDays: number;
    travelKm: number;    // one-way km
    teamSize: number;
    equipmentCount: number;    // number of equipment pieces
    editingHours: number;    // estimated post-processing hours
    hasStay?: boolean;   // overnight stay required
}

export interface BudgetLineItem {
    category: string;
    item: string;
    estimated: number;   // INR
    notes: string;
}

export interface BudgetResult {
    totalEstimated: number;
    breakdown: BudgetLineItem[];
    contingency: number;    // 10% buffer
    grandTotal: number;    // totalEstimated + contingency
    savingsTips: string[];
}

export async function estimateBudget(input: BudgetInput): Promise<BudgetResult> {
    const prompt = `You are a photography business consultant in India helping calculate shoot expenses.
Estimate expenses for this photography project:
- Event Type: ${input.eventType}
- Duration: ${input.numberOfDays} day(s)
- Travel: ${input.travelKm} km one-way
- Team Size: ${input.teamSize} members
- Equipment Pieces: ${input.equipmentCount}
- Estimated Editing Hours: ${input.editingHours}
- Overnight Stay Required: ${input.hasStay ? "Yes" : "No"}

Use realistic Indian market rates:
- Travel: ₹12/km for vehicle, ₹300-500/day per person local transport
- Stay: ₹800-1500/night per person if required
- Meals: ₹300-600/day per person
- Equipment maintenance/depreciation: ₹500-2000/day for full kit
- Editing: ₹500-1000/hour

Return ONLY valid JSON in this exact structure:
{
  "totalEstimated": 18500,
  "breakdown": [
    { "category": "Travel", "item": "Vehicle fuel (${input.travelKm * 2} km round trip)", "estimated": 3000, "notes": "@₹12/km" },
    { "category": "Team", "item": "Team meals (${input.teamSize} people × ${input.numberOfDays} days)", "estimated": 4500, "notes": "₹500/person/day" },
    { "category": "Equipment", "item": "Equipment wear & maintenance", "estimated": 2000, "notes": "Per day allocation" },
    { "category": "Editing", "item": "Post-processing (${input.editingHours} hrs)", "estimated": 9000, "notes": "₹750/hour" }
  ],
  "contingency": 1850,
  "grandTotal": 20350,
  "savingsTips": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const raw = await callGroq(prompt);
    const parsed = extractJSON(raw);
    return parsed as BudgetResult;
}
