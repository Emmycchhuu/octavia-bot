
/**
 * Octavia Local Brain: Conversational Patterns & Sentiment
 * Handles greetings, insults, and common chatter with RANDOMIZED responses.
 */

const RESPONSES = {
    // Greetings (Varied to avoid repetition)
    'greetings': [
        "Hello! 👋 How can I help you today?",
        "Hi there! Emmy is busy, but I'm here. What's up?",
        "Greetings! Octavia at your service. 🤖",
        "Hey! Need to schedule something or just chatting?",
        "Hello hello! 🌟",
        "Yo! What's the latest?",
        "Hi! Hope your code is compiling today! 💻"
    ],

    // Gratitude
    'thanks': [
        "You're very welcome!",
        "No problem at all! Happy to help.",
        "Anytime! That's what I'm here for.",
        "Glad I could be of assistance! 🚀",
        "Don't mention it!",
        "You got it! 👍"
    ],

    // Rude/Bad Words (Sentiment Defense)
    'insult': [
        "That wasn't very nice. I'm just a bot trying my best. 😢",
        "I'm going to pretend I didn't hear that.",
        "Let's keep it professional, please.",
        "Sticks and stones may break my bones, but code excludes error handling for insults.",
        "Is everything okay? You seem stressed.",
        "Sarcasm mode loading... just kidding. Please be nice. 😐"
    ],

    // Confirmation
    'ok': [
        "Cool.",
        "Alrighty then.",
        "Roger that. 🫡",
        "Noted.",
        "Okie dokie!",
        "Sounds good."
    ],

    // Funny/Random
    'lol': [
        "😂",
        "I know, right?",
        "Laughter is the best exception handler.",
        "Glad I could make you smile!",
        "Haha!"
    ]
};

// Regex Patterns
const PATTERNS = [
    { type: 'greetings', regex: /\b(hi|hello|hey|sup|greetings|yo)\b/i },
    { type: 'thanks', regex: /\b(thanks|thank you|thx|appreciate it)\b/i },
    { type: 'insult', regex: /\b(stupid|idiot|dumb|hate you|shut up|useless|trash)\b/i },
    { type: 'ok', regex: /\b(ok|okay|cool|alright|fine)\b/i },
    { type: 'lol', regex: /\b(lol|lmao|haha|hehe|rofl)\b/i }
];

function processPatterns(message) {
    const cleanMsg = message.toLowerCase().trim();

    for (const pattern of PATTERNS) {
        if (pattern.regex.test(cleanMsg)) {
            const possibleReplies = RESPONSES[pattern.type];
            // Pick a RANDOM reply from the list
            const randomIndex = Math.floor(Math.random() * possibleReplies.length);
            return possibleReplies[randomIndex];
        }
    }

    return null;
}

module.exports = { processPatterns };
