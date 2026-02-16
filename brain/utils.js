
/**
 * Octavia Local Brain: Utilities & Fun
 * Random generators and decision helpers.
 */

function processUtils(query) {
    const q = query.toLowerCase();

    // Coin Flip
    if (q.includes('flip') && q.includes('coin')) {
        return Math.random() > 0.5 ? '🪙 *Heads!*' : '🪙 *Tails!*';
    }

    // Dice Roll
    if (q.includes('roll') && q.includes('dice')) {
        return `🎲 You rolled a *${Math.floor(Math.random() * 6) + 1}*!`;
    }

    // Pick Choice: "Pick red or blue"
    if (q.startsWith('pick ')) {
        const choices = query.substring(5).split(/\sor\s|,/);
        if (choices.length > 1) {
            const choice = choices[Math.floor(Math.random() * choices.length)].trim();
            return `🤔 I choose... *${choice}*!`;
        }
    }

    return null;
}

module.exports = { processUtils };
