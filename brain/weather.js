
/**
 * Octavia Local Brain: Weather
 * Fetches weather from wttr.in (No API Key required)
 */

// Note: This requires 'node-fetch' or native fetch (Node 18+)
// Since we are in a bot, we likely need to return a Promise or handle async.
// The brain architecture was synchronous so far. We need to update index.js to await results.
// But for now, let's keep it simple. If we can't do async easily in the loop, we might need a workaround.
// However, 'index.js' DOES await processLocalBrain? No, it doesn't currently. 
// Let's check index.js. 
// "const localReply = processLocalBrain(lowerMsg);" -> It's synchronous.
// We should make processLocalBrain async to support Weather.

async function processWeather(message) {
    const clean = message.toLowerCase().trim();

    // "Weather in Lagos"
    const match = clean.match(/weather (in|for) ([a-z\s]+)/);
    if (match) {
        const city = match[2].trim();
        try {
            const response = await fetch(`https://wttr.in/${city}?format=3`);
            const text = await response.text();
            return `🌦️ *Weather Report:*\n${text.trim()}`;
        } catch (e) {
            return `❌ Couldn't fetch weather for ${city}.`;
        }
    }

    return null;
}

module.exports = { processWeather };
