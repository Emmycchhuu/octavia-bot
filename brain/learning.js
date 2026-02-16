
/**
 * Octavia Local Brain: Passive Learning
 * Detects facts in user messages and remembers them.
 */
const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, 'memory.json');

function getMemory() {
    if (!fs.existsSync(MEMORY_FILE)) {
        fs.writeFileSync(MEMORY_FILE, '{}');
    }
    return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
}

function saveMemory(contact, key, value) {
    const memories = getMemory();
    if (!memories[contact]) memories[contact] = {};
    memories[contact][key] = value;
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2));
}

function processLearning(message, contactName) {
    const clean = message.toLowerCase().trim();

    // 1. LEARN FACTS
    // "My name is John"
    const nameMatch = clean.match(/my name is ([a-z\s]+)/);
    if (nameMatch) {
        const name = nameMatch[1].trim();
        saveMemory(contactName, 'name', name);
        return `🧠 *Memorized:* I'll remember that your name is *${name}*.`;
    }

    // "I like pizza" / "I love coding"
    const likeMatch = clean.match(/i (like|love) ([a-z0-9\s]+)/);
    if (likeMatch) {
        const item = likeMatch[2].trim();
        // We can append to a list or just overwrite 'favorite'
        saveMemory(contactName, 'likes', item);
        return `🧠 *Memorized:* I'll remember that you like *${item}*.`;
    }

    // "My dog is Rex" / "My city is London"
    const possessionMatch = clean.match(/my (dog|cat|city|job|car) is ([a-z0-9\s]+)/);
    if (possessionMatch) {
        const key = possessionMatch[1].trim();
        const value = possessionMatch[2].trim();
        saveMemory(contactName, key, value);
        return `🧠 *Memorized:* I've noted that your *${key}* is *${value}*.`;
    }

    // 2. RECALL FACTS
    // "What is my name?"
    if (clean.includes('what is my name') || clean.includes('who am i')) {
        const mem = getMemory();
        if (mem[contactName] && mem[contactName].name) {
            return `🤔 You told me your name is *${mem[contactName].name}*.`;
        }
        return `🤔 I don't know yet! Tell me "My name is..."`;
    }

    // "What do I like?"
    if (clean.includes('what do i like')) {
        const mem = getMemory();
        if (mem[contactName] && mem[contactName].likes) {
            return `🤔 You said you like *${mem[contactName].likes}*.`;
        }
    }

    // "Where do I live?" (Checks 'city')
    if (clean.includes('where do i live') || clean.includes('my city')) {
        const mem = getMemory();
        if (mem[contactName] && mem[contactName].city) {
            return `🤔 You live in *${mem[contactName].city}*.`;
        }
    }

    // Generic Recall: "What do you know about me?"
    if (clean === 'what do you know about me' || clean === 'my info') {
        const mem = getMemory();
        const userMem = mem[contactName];
        if (!userMem || Object.keys(userMem).length === 0) {
            return `🧠 I don't know much about you yet. Chat with me more!`;
        }

        let info = `🧠 *What I know about you:*\n`;
        for (const [k, v] of Object.entries(userMem)) {
            info += `- *${k.charAt(0).toUpperCase() + k.slice(1)}:* ${v}\n`;
        }
        return info;
    }

    return null;
}

module.exports = { processLearning };
