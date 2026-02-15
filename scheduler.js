const cron = require('node-cron');
const fs = require('fs');
const { getCryptoPrice } = require('./tools');

/**
 * Scheduler for daily briefings and reminders
 * @param {object} client - WhatsApp client instance
 */
function initScheduler(client) {
    // Daily Briefing at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        const personality = JSON.parse(fs.readFileSync('./personality.json', 'utf8'));
        const btcPrice = await getCryptoPrice('bitcoin');
        const briefing = `☀️ *Good Morning, ${personality.owner_name}!*\n\n` +
            `Octavia is ready for the day. Here's your briefing:\n` +
            `- ${btcPrice}\n` +
            `- You have (X) pending meeting requests.\n\n` +
            `Have a productive day! 🚀`;

        // Send to owner's self-chat
        const ownerChatId = client.info.wid._serialized;
        await client.sendMessage(ownerChatId, briefing);
        console.log('Daily briefing sent.');
    });

    console.log('Octavia Scheduler initialized.');
}

module.exports = { initScheduler };
