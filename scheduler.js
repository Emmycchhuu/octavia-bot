const cron = require('node-cron');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Load keys for status generation
const keys = process.env.GEMINI_KEYS ? process.env.GEMINI_KEYS.split(',') : [];

/* 
 * Generates a status update using AI
 * Topic varies by time of day
 */
async function generateStatusContent(topic) {
    if (keys.length === 0) return null;
    const genAI = new GoogleGenerativeAI(keys[0].trim());
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const prompt = `Write a short, engaging WhatsApp status (max 2 sentences) about: ${topic}. 
        Tone: Smart, developer-focused, slightly witty. 
        Author: Emmy D West's AI Assistant. 
        No hashtags.`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (e) {
        console.error("Status Gen Error:", e.message);
        return null; // Fail silently
    }
}

/**
 * Scheduler for daily briefings and 3x daily status updates
 */
function initScheduler(client) {
    const statusLog = (msg) => console.log(`[Scheduler] ${msg}`);

    // 1. Morning Status (9:00 AM) - Motivation/Dev Life
    cron.schedule('0 9 * * *', async () => {
        statusLog('Generating Morning Status...');
        const content = await generateStatusContent("Morning motivation for developers or a funny coding fact");
        if (content) {
            await client.sendMessage('status@broadcast', content);
            statusLog('Posted Morning Status');
        }
    });

    // 2. Afternoon Status (2:00 PM) - Tech News/Tip
    cron.schedule('0 14 * * *', async () => {
        statusLog('Generating Afternoon Status...');
        const content = await generateStatusContent("A quick tip about JavaScript, AI, or Web Development");
        if (content) {
            await client.sendMessage('status@broadcast', content);
            statusLog('Posted Afternoon Status');
        }
    });

    // 3. Evening Status (8:00 PM) - Witty/Relaxed
    cron.schedule('0 20 * * *', async () => {
        statusLog('Generating Evening Status...');
        const content = await generateStatusContent("Relaxing after coding or a joke about debugging");
        if (content) {
            await client.sendMessage('status@broadcast', content);
            statusLog('Posted Evening Status');
        }
    });

    // Daily Briefing for Emmy (8:00 AM)
    cron.schedule('0 8 * * *', async () => {
        const personality = JSON.parse(fs.readFileSync('./personality.json', 'utf8'));
        const briefing = `☀️ *Good Morning, ${personality.owner_name}!*\n\n` +
            `Octavia is online and ready.\n` +
            `Scheduled status updates are armed for 9am, 2pm, and 8pm.\n\n` +
            `Have a productive day! 🚀`;

        const ownerChatId = client.info.wid._serialized;
        await client.sendMessage(ownerChatId, briefing);
    });

    console.log('Octavia Scheduler initialized: 3x Daily Status + Briefing.');
}

module.exports = { initScheduler };
