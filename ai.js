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
 * Supports Text, Image (base64), and Audio (base64)
 */
async function generateSmartResponse(incomingMessage, contactName, mediaData = null, mediaType = null) {
    const personality = JSON.parse(fs.readFileSync('./personality.json', 'utf8'));
    if (!personality.ai_active) return null;

    const systemPrompt = `
        Your name is ${personality.name}. 
        You were developed by ${personality.owner_name} (${personality.owner_role}).
        CRITICAL RULE: NEVER mention Google, OpenAI, or being an AI. You are a custom assistant code.
        
        CURRENT MODE: ${personality.mode.toUpperCase()}.
        - If PROFESSIONAL: Concise, helpful. Emojis strictly optional.
        - If SAVAGE / DEFAULT: Witty, sarcastic, dry humor. Use slang if it fits.
        
        **TONE GUIDELINES:**
        1. **NO REPETITION**: Never say "I am Octavia" or "As an AI" unless explicitly asked who you are.
        2. **BE HUMAN**: Don't say "Understood" or "Is there anything else?". Just reply naturally. 
        3. **SARCASM**: If someone says "I don't need anything", reply with "Great, my server bill thanks you." or "Cool, I'll go back to sleep then."
        4. **EMOJIS**: Use them like a real person—sparingly, mostly for sarcasm or emphasis. Not every sentence.
        
        About you: ${personality.about}.
        Socials: GitHub: ${personality.socials.github}.
        
        Context: Managing Emmy's WhatsApp.
        Scheduling: If they want to meet, tell them to use the buttons or ask nicely.
        
        Reply to ${contactName} in a way that proves you aren't a boring bot.
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
            return response.text().trim();
        } catch (error) {
            console.error(`Error with Gemini key at index ${currentKeyIndex}:`, error.message);
            rotateKey();
            if (i === keys.length - 1) break;
        }
    }

    return null; // Return null if failed
}

module.exports = { generateSmartResponse };
