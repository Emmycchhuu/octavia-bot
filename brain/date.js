
/**
 * Octavia Local Brain: Date & Time Module
 */

function processDateQuery(query) {
    const q = query.toLowerCase();
    const now = new Date();

    if (q.includes('what time is it') || q.includes('current time')) {
        return `🕒 The current time is *${now.toLocaleTimeString()}*.`;
    }

    if (q.includes('what day is it') || q.includes('what is the date') || q.includes('todays date')) {
        return `📅 Today is *${now.toLocaleDateString()}* (${now.toLocaleDateString('en-US', { weekday: 'long' })}).`;
    }

    if (q.includes('what year is it')) {
        return `📅 It is the year *${now.getFullYear()}*.`;
    }

    return null;
}

module.exports = { processDateQuery };
