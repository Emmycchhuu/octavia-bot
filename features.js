const fs = require('fs');

/**
 * Handles status updates and other utility features
 * @param {object} client - The WhatsApp client instance
 * @param {string} text - Message to post on status
 */
async function postToStatus(client, text) {
    try {
        // In whatsapp-web.js, posting to status is done by sending to 'status@broadcast'
        await client.sendMessage('status@broadcast', text);
        return true;
    } catch (error) {
        console.error('Error posting to status:', error);
        return false;
    }
}

module.exports = { postToStatus };
