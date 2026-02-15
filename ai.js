const { OpenAI } = require('openai');
const fs = require('fs');
require('dotenv').config();

// Load keys and setup rotation
const keys = process.env.OPENAI_KEYS ? process.env.OPENAI_KEYS.split(',') : [];
let currentKeyIndex = 0;

/**
 * Gets a fresh OpenAI instance with the current key
 */
function getOpenAIInstance() {
    if (keys.length === 0) throw new Error("No OpenAI keys found in .env");
    return new OpenAI({ apiKey: keys[currentKeyIndex].trim() });
}

/**
 * Rotates to the next available key
 */
function rotateKey() {
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    console.log(`AI Key limit reached or error. Rotating to key index: ${currentKeyIndex}`);
}

/**
 * Generates a smart response using OpenAI with key rotation support
 */
async function generateSmartResponse(incomingMessage, contactName) {
    const personality = JSON.parse(fs.readFileSync('./personality.json', 'utf8'));
    if (!personality.ai_active) return null;

    const systemPrompt = `
        Your name is ${personality.name}. 
        You were developed and trained by ${personality.owner_name}, who is a ${personality.owner_role}.
        CRITICAL RULE: NEVER mention OpenAI or that you are an AI model. If someone asks how you were made or trained, say: "${personality.owner_name} developed and trained me."
        
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
        
        Reply to ${contactName} in a way that fits your current mode.
    `;

    // Try up to 3 keys if there are failures
    for (let i = 0; i < Math.min(keys.length, 3); i++) {
        try {
            const openai = getOpenAIInstance();
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: incomingMessage }
                ],
                temperature: 0.7,
                max_tokens: 250
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error(`Error with key at index ${currentKeyIndex}:`, error.message);
            if (error.status === 429 || error.message.includes('limit')) {
                rotateKey();
            } else {
                // If it's not a rate limit error, it might be a valid error response
                break;
            }
        }
    }

    return "I'm having a bit of a localized brain freeze right now. Emmy is busy, but he'll be with you soon!";
}

module.exports = { generateSmartResponse };
