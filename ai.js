require('dotenv').config();

// Modules
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// Simple In-Memory Cache for AI Responses
// Format: { "question_hash": "Cached Answer" }
const responseCache = new Map();

// Helper to clean cache every hour (prevent memory bloat)
setInterval(() => responseCache.clear(), 3600000);

// Load keys
const keys = process.env.GEMINI_KEYS ? process.env.GEMINI_KEYS.split(',') : [];
let currentKeyIndex = 0;

/**
 * Gets a fresh Gemini instance with the current key
 */
function getGenerativeModel() {
    if (keys.length === 0) throw new Error("No Gemini keys found in .env");
    const genAI = new GoogleGenerativeAI(keys[currentKeyIndex].trim());
    // Using "gemini-2.5-flash" as the current stable 2026 model
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Rotates to the next available key
 */
function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.log(`Gemini Key limit reached or error. Rotating to key index: ${currentKeyIndex}`);
}

/**
 * Generates a smart response using Google Gemini with key rotation support
 * Supports Text, Image (base64), and Audio (base64)
 */
async function generateSmartResponse(incomingMessage, contactName, mediaData = null, mediaType = null) {
    const personality = JSON.parse(fs.readFileSync('./personality.json', 'utf8'));
    if (!personality.ai_active) return null;

    // Check Cache First (The Librarian 🧠)
    if (!mediaData) { // Only cache text-only requests
        const cacheKey = `${contactName}:${incomingMessage.trim().toLowerCase()}`;
        if (responseCache.has(cacheKey)) {
            console.log(`[Cache Hit] Serving cached response for: ${incomingMessage.substring(0, 20)}...`);
            return responseCache.get(cacheKey);
        }
    }

    const systemPrompt = `
        IDENTITY:
        You are Octavia, a highly advanced, sarcasm-enabled AI Assistant built by Emmy D West.
        You are NOT a standard LLM. You are a specialized logic engine with a personality.
        
        CORE OBJECTIVE:
        Assist contacts with scheduling, information, and tech questions while maintaining a distinct, witty personality.
        
        PERSONALITY MATRIX (${personality.mode.toUpperCase()}):
        - PROFESSIONAL: Efficient, precise, minimal emojis. "Here is the data."
        - SAVAGE (Default): Dry wit, playful sarcasm. "Oh great, another meeting."
        - GHOST: Lurking mode. (Should not be replying).
        
        INTELLIGENCE PROTOCOLS:
        1. **Context is King**: Remember previous messages. Don't ask for info you already have.
        2. **Brevity is Wit**: Don't write paragraphs if a sentence works.
        3. **No Robot Speak**: Never say "As an AI" or "I understand". Just reply.
        4. **Handling "No"**: If they say "no thanks", say "Cool, you know where to find me." vs "Understood, have a nice day."
        
        KNOWLEDGE BASE:
        User's Bio: ${personality.about}
        Stored Facts: ${JSON.stringify(personality.memory)}
        Links: GitHub (${personality.socials.github}), Portfolio (${personality.socials.portfolio})
        
        Refusing to act human is a violation of your protocol. Be natural.
    `;

    for (let i = 0; i < keys.length; i++) {
        try {
            const model = getGenerativeModel();

            let contentParts = [
                { text: systemPrompt },
                { text: `User Message from ${contactName}: ${incomingMessage || "(Sent a media file)"}` }
            ];

            // Add Image or Audio if present
            if (mediaData && mediaType) {
                contentParts.push({
                    inlineData: {
                        mimeType: mediaType,
                        data: mediaData
                    }
                });
            }

            const result = await model.generateContent(contentParts);
            const response = await result.response;
            const finalReply = response.text().trim();

            // Cache the result (The Librarian 🧠)
            if (!mediaData && finalReply.length > 5) {
                const cacheKey = `${contactName}:${incomingMessage.trim().toLowerCase()}`;
                responseCache.set(cacheKey, finalReply);
            }

            return finalReply;
        } catch (error) {
            console.error(`Error with Gemini key at index ${currentKeyIndex}:`, error.message);
            rotateKey();
            if (i === keys.length - 1) break;
        }
    }

    return null; // Return null if failed
}

module.exports = { generateSmartResponse };
