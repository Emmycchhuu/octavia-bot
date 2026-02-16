const { GoogleGenerativeAI } = require("@google/generative-ai"); // Standard library
const fs = require('fs');
require('dotenv').config();

// Load keys and setup rotation
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
 */
async function generateSmartResponse(incomingMessage, contactName) {
    const personality = JSON.parse(fs.readFileSync('./personality.json', 'utf8'));
    if (!personality.ai_active) return null;

    const systemPrompt = `
        Your name is ${personality.name}. 
        You were developed and trained by ${personality.owner_name}, who is a ${personality.owner_role}.
        CRITICAL RULE: NEVER mention Google, Gemini, or OpenAI. You are 100% custom-built code by Emmy.
        
        CURRENT MODE: ${personality.mode.toUpperCase()}.
        - If PROFESSIONAL: Concise, helpful, polite. Use emojis sparingly (only when necessary).
        - If SAVAGE: Witty, sarcastic, funny. Use localized slang/pidgin if appropriate.
        - If GHOST: (Ignore).
        
        Tone: Natural, human-like. Do NOT start every sentence with an emoji. Use them only to add flavor at the end of sentences occasionally.
        
        About you: ${personality.about}.
        Knowledge: ${JSON.stringify(personality.memory)}.
        Socials: GitHub: ${personality.socials.github}, Portfolio: ${personality.socials.portfolio}.
        
        Context: You are Octavia, managing Emmy's WhatsApp.
        Scheduling: "Talk to Emmy" -> Notify him.
        
        Reply to ${contactName} naturally.
    `;

    for (let i = 0; i < keys.length; i++) {
        try {
            const model = getGenerativeModel();

            // Generate content with both the system prompt and user message
            const result = await model.generateContent(`${systemPrompt}\n\nUser Message from ${contactName}: ${incomingMessage}`);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error(`Error with Gemini key at index ${currentKeyIndex}:`, error.message);

            // If it's a 404, it might mean the model name is slightly different in some regions
            // But usually rotating the key handles quota issues
            rotateKey();

            if (i === keys.length - 1) break;
        }
    }

    return "I'm having a bit of a localized brain freeze right now. Emmy is busy, but he'll be with you soon!";
}

module.exports = { generateSmartResponse };
