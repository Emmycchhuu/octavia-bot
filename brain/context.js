
/**
 * Octavia Local Brain: Context Manager
 * Tracks the current topic of conversation per user.
 */

const fs = require('fs');
const path = require('path');

const CONTEXT_FILE = path.join(__dirname, 'context.json');

function getContexts() {
    if (!fs.existsSync(CONTEXT_FILE)) {
        fs.writeFileSync(CONTEXT_FILE, '{}');
    }
    return JSON.parse(fs.readFileSync(CONTEXT_FILE, 'utf8'));
}

function saveContext(contexts) {
    fs.writeFileSync(CONTEXT_FILE, JSON.stringify(contexts, null, 2));
}

function updateContext(contact, topic) {
    const ctx = getContexts();
    // Only update if topic is meaningful (not null)
    if (topic) {
        ctx[contact] = {
            topic: topic,
            last_update: Date.now()
        };
        saveContext(ctx);
    }
}

function getContext(contact) {
    const ctx = getContexts();
    if (!ctx[contact]) return null;

    // Expire context after 10 minutes (600,000 ms)
    if (Date.now() - ctx[contact].last_update > 600000) {
        delete ctx[contact];
        saveContext(ctx);
        return null;
    }

    return ctx[contact].topic;
}

// Simple Topic Detector
function detectTopic(message) {
    const clean = message.toLowerCase();

    if (clean.match(/(bug|error|code|js|python|react|node|css|html|fix)/)) return 'tech_frustration';
    if (clean.match(/(food|eat|hungry|lunch|dinner|breakfast|pizza|burger)/)) return 'food';
    if (clean.match(/(sad|cry|depressed|unhappy|fail)/)) return 'sad_user';
    if (clean.match(/(happy|great|win|success|yay)/)) return 'happy_user';
    if (clean.match(/(love|like you|marry me)/)) return 'love';
    if (clean.match(/(life|universe|real|dream|think)/)) return 'philosophical';

    return null;
}

module.exports = { updateContext, getContext, detectTopic };
