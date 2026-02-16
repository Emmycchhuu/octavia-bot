
/**
 * Octavia Local Brain: Chat Engine
 * Combines Sentiment, Context, and Chat DB to simulate conversation.
 */
const fs = require('fs');
const path = require('path');
const { analyzeSentiment } = require('./sentiment');
const { updateContext, getContext, detectTopic } = require('./context');

const CHAT_DB = JSON.parse(fs.readFileSync(path.join(__dirname, 'chat_db.json'), 'utf8'));

function processChat(message, contactName) {
    const clean = message.toLowerCase().trim();

    // 1. Detect Sentiment
    const sentiment = analyzeSentiment(clean);

    // 2. Detect New Topic
    let topic = detectTopic(clean);

    // 3. Fallback to Context if no new topic found
    if (!topic) {
        topic = getContext(contactName);
    }

    // 4. Update Context
    updateContext(contactName, topic);

    // 5. Select Response Strategy
    let key = null;

    // FORCE overrides based on strong sentiment/keywords
    if (sentiment === 'NEGATIVE' && !topic) key = 'sad_user'; // Default to comforting if negative but no topic
    if (sentiment === 'POSITIVE' && !topic) key = 'happy_user';
    if (clean.match(/(bad|rude|stupid)/)) key = 'insult';
    if (clean.match(/(thank|thanks)/)) key = 'compliment';

    // Use Topic if available
    if (topic && CHAT_DB[topic]) {
        key = topic;
    }

    // Default to Small Talk if nothing else matches
    if (!key && (sentiment === 'NEUTRAL' || sentiment === 'POSITIVE')) {
        // Only do small talk for short messages to avoid interrupting serious queries
        if (clean.length < 20) key = 'small_talk';
    }

    // 6. Return Random Response
    if (key && CHAT_DB[key]) {
        const responses = CHAT_DB[key];
        const reply = responses[Math.floor(Math.random() * responses.length)];
        return `💬 ${reply}`;
    }

    return null;
}

module.exports = { processChat };
