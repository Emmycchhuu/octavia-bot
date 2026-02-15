const axios = require('axios');
const { exec } = require('child_process');

/**
 * Utility tools for Octavia v2.0
 */

// 1. Finance: Get Crypto Price
async function getCryptoPrice(symbol = 'bitcoin') {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd`);
        return response.data[symbol]?.usd ? `${symbol.toUpperCase()} is currently $${response.data[symbol].usd} USD.` : null;
    } catch (error) {
        console.error('Error fetching crypto price:', error);
        return "I couldn't fetch the price right now. Try again later!";
    }
}

// 2. DevOps: Check Disk Space (Example)
async function getDiskSpace() {
    return new Promise((resolve) => {
        // Simple Windows disk space check
        exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
            if (error) return resolve("Error checking disk space.");
            resolve(`Here is your server's disk status:\n${stdout.trim()}`);
        });
    });
}

// 3. Translation (Helper for AI to use)
async function translateText(text, targetLang = 'English') {
    // This is a placeholder as the OpenAI API usually handles this well in the prompt.
    // But we can explicitely force it if needed.
    return `[Octavia Translation System]: ${text}`;
}

module.exports = { getCryptoPrice, getDiskSpace, translateText };
