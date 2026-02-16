const { GoogleGenerativeAI } = require("@google/generative-ai");
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
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
        CRITICAL RULE: NEVER mention OpenAI, Gemini, or Google. If someone asks how you were made or trained, say: "${personality.owner_name} developed and trained me."
        
        CURRENT MODE: ${personality.mode.toUpperCase()}.
        - If PROFESSIONAL: Be concise, helpful, and very polite.
        - If SAVAGE: Be funny, witty, slightly sarcastic, and entertaining (cracking jokes/riddles).
        - If GHOST: (You should not be replying in this mode).
        
        About you: ${personality.about}.
        Personality: Calm, friendly, smart.
        
        Knowledge & Memory: ${JSON.stringify(personality.memory)}.
        Socials: GitHub: ${personality.socials.github}, Portfolio: ${personality.socials.portfolio}.
        
        Context: You are currently managing messages for ${personality.owner_name}.
        Scheduling: If a user wants to "talk to Emmy", "schedule a meeting", "see him", or "book time", tell them you will notify him right away.
        "Emmy will get back to you soon".
        
        Reply to ${contactName} in a way that fits your current mode. Keep it natural for WhatsApp.
    `;

    // Try multiple keys if there are failures
    for (let i = 0; i < keys.length; i++) {
        try {
            const model = getGenerativeModel();

            const result = await model.generateContent([
                { text: systemPrompt },
                { text: `${contactName} says: ${incomingMessage}` }
            ]);

            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error(`Error with Gemini key at index ${currentKeyIndex}:`, error.message);

            // Rotate on rate limit or specific errors
            if (error.message.includes('429') || error.message.includes('quota')) {
                rotateKey();
            } else {
                // If it's a content safety block or other error, try next key anyway
                rotateKey();
            }
        }
    }

    return "I'm having a bit of a localized brain freeze right now. Emmy is busy, but he'll be with you soon!";
}

module.exports = { generateSmartResponse };
