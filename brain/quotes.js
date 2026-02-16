
/**
 * Octavia Local Brain: Quotes
 * Returns random developer quotes.
 */

const QUOTES = [
    "Talk is cheap. Show me the code. – Linus Torvalds",
    "Programs must be written for people to read, and only incidentally for machines to execute. – Harold Abelson",
    "Truth can only be found in one place: the code. – Robert C. Martin",
    "Optimism is an occupational hazard of programming: feedback is the treatment. – Kent Beck",
    "Simplicity is the soul of efficiency. – Austin Freeman",
    "Before software can be reusable it first has to be usable. – Ralph Johnson",
    "Make it work, make it right, make it fast. – Kent Beck",
    "Fix the cause, not the symptom. – Steve Maguire",
    "Code is like humor. When you have to explain it, it’s bad. – Cory House",
    "Java is to JavaScript what car is to Carpet. – Chris Heilmann"
];

function processQuotes(message) {
    const clean = message.toLowerCase();

    if (clean.includes('quote') || clean.includes('motivate me') || clean.includes('inspiration')) {
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        return `📜 *Dev Wisdom:*\n"${randomQuote}"`;
    }

    return null;
}

module.exports = { processQuotes };
