const fs = require('fs');
const path = require('path');
const { solveMath } = require('./math');
const { processDateQuery } = require('./date');

// Load static knowledge
const knowledgeBase = JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge.json'), 'utf8'));

/**
 * The Central Local Brain
 * Checks: Math -> Static Knowledge -> null (Pass to Gemini)
 */
function processLocalBrain(message) {
    const cleanMsg = message.toLowerCase().trim();

    // 1. Check Math (e.g., "5 * 5")
    // Simple heuristic: contains math operators and numbers
    if (/[0-9]/.test(cleanMsg) && /[+\-*/]/.test(cleanMsg)) {
        const mathResult = solveMath(cleanMsg);
        if (mathResult) return mathResult;
    }

    // 2. Check Date & Time
    const dateResult = processDateQuery(cleanMsg);
    if (dateResult) return dateResult;

    // 3. Check Static Knowledge (Exact & Fuzzy Match)
    for (const [question, answer] of Object.entries(knowledgeBase)) {
        if (cleanMsg.includes(question)) {
            return answer;
        }
    }

    return null; // No local match found
}

module.exports = { processLocalBrain };
