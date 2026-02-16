
const fs = require('fs');
const path = require('path');
const { solveMath } = require('./math');
const { processDateQuery } = require('./date');
const { processConverter } = require('./converter');
const { processSystem } = require('./sys');
const { processUtils } = require('./utils');
const { processReminder } = require('./remind');
const { processPatterns } = require('./patterns');
const { processNotes } = require('./notes');
const { processQuotes } = require('./quotes');
const { processLearning } = require('./learning');
const { processTodo } = require('./todo');
const { processDictionary } = require('./dictionary');
const { processWeather } = require('./weather');
const { processChat } = require('./chat');

// Load static knowledge
const knowledgeBase = JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge.json'), 'utf8'));

/**
 * The Central Local Brain
 * Checks: Math -> Date -> Sys -> Converter -> Utils -> Remind -> Notes -> Todo -> Dict -> Weather -> Learning -> Patterns -> Knowledge -> null
 * NOW ASYNC to support Weather fetch.
 */
async function processLocalBrain(message, contactName = 'Friend') {
    const cleanMsg = message.toLowerCase().trim();

    // 1. Math
    if (/[0-9]/.test(cleanMsg) && /[+\-*/]/.test(cleanMsg)) {
        const mathResult = solveMath(cleanMsg);
        if (mathResult) return mathResult;
    }

    // 2. Date & Time
    const dateResult = processDateQuery(cleanMsg);
    if (dateResult) return dateResult;

    // 3. Sys Monitor
    const sysResult = processSystem(cleanMsg);
    if (sysResult) return sysResult;

    // 4. Converter
    const convResult = processConverter(cleanMsg);
    if (convResult) return convResult;

    // 5. Utilities (Coin/Dice)
    const utilResult = processUtils(cleanMsg);
    if (utilResult) return utilResult;

    // 6. Reminders
    const remindResult = processReminder(cleanMsg);
    if (remindResult) return remindResult;

    // 7. Notes (Memory)
    const noteResult = processNotes(message, contactName);
    if (noteResult) return noteResult;

    // 8. Todo List
    const todoResult = processTodo(message, contactName);
    if (todoResult) return todoResult;

    // 9. Dev Dictionary
    const dictResult = processDictionary(cleanMsg);
    if (dictResult) return dictResult;

    // 10. Weather (Async)
    const weatherResult = await processWeather(cleanMsg);
    if (weatherResult) return weatherResult;

    // 11. Learning (Passive Memory)
    const learnResult = processLearning(message, contactName);
    if (learnResult) return learnResult;

    // 12. Quotes
    const quoteResult = processQuotes(cleanMsg);
    if (quoteResult) return quoteResult;

    // 13. Conversational Patterns (Legacy Patterns - keep as backup or remove if Chat Engine covers it)
    // We will keep Chat Engine ("Offline NLP") as the primary conversationalist now.
    const chatResult = processChat(message, contactName);
    if (chatResult) return chatResult;

    const patternResult = processPatterns(cleanMsg);
    if (patternResult) return patternResult;

    // 15. Static Knowledge
    for (const [question, answer] of Object.entries(knowledgeBase)) {
        if (cleanMsg.includes(question)) {
            return answer;
        }
    }

    return null; // No local match found
}

module.exports = { processLocalBrain };
