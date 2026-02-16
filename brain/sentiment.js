
/**
 * Octavia Local Brain: Sentiment Engine
 * dictionary-based emotion detection.
 */

const POSITIVE_WORDS = [
    'good', 'great', 'awesome', 'amazing', 'love', 'happy', 'cool', 'nice', 'best',
    'thanks', 'thank', 'appreciate', 'wow', 'fun', 'excited', 'glad', 'perfect', 'excellent',
    'smart', 'brilliant', 'genius', 'rock', 'rule', 'win', 'winning'
];

const NEGATIVE_WORDS = [
    'bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'stupid', 'dumb', 'worst',
    'error', 'broken', 'fail', 'failed', 'annoying', 'boring', 'slow', 'ugly', 'trash',
    'useless', 'bug', 'crash', 'pain', 'hurt', 'hard', 'difficult'
];

function analyzeSentiment(message) {
    const tokens = message.toLowerCase().split(/\s+/);
    let score = 0;

    tokens.forEach(word => {
        if (POSITIVE_WORDS.includes(word)) score++;
        if (NEGATIVE_WORDS.includes(word)) score--;
    });

    if (score > 0) return 'POSITIVE';
    if (score < 0) return 'NEGATIVE';
    return 'NEUTRAL';
}

module.exports = { analyzeSentiment };
