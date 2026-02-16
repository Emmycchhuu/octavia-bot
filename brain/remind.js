
/**
 * Octavia Local Brain: Reminders
 * Simple in-memory timer system.
 * NOTE: Clears on restart.
 */

// We can't easily push messages BACK to index.js from here without passing the client object.
// So we'll return a setup object or message.
// Actually, this logic is tricky in a pure function reply system.
// For now, we'll return a text saying "Timer set" and the main process would need to handle the timeout.
// To keep it simple for this architecture:
// We will return a "SPECIAL_ACTION" object if possible? 
// Or better, we just tell the user "I can't set timers yet without a DB" - wait, let's try to pass the 'callback' capability?
// No, the simplest is to return a formatted string that index.js detects and handles.

function processReminder(query) {
    // "Remind me in 10m to check server"
    const match = query.toLowerCase().match(/remind me in (\d+)(m|h|s) to (.+)/);

    if (match) {
        const val = parseInt(match[1]);
        const unit = match[2];
        const task = match[3];

        let ms = 0;
        if (unit === 's') ms = val * 1000;
        if (unit === 'm') ms = val * 60 * 1000;
        if (unit === 'h') ms = val * 60 * 60 * 1000;

        // Return a structured object that index.js can interpret
        return {
            type: 'ACTION_REMINDER',
            ms: ms,
            task: task,
            reply: `⏰ *Timer Set!* I'll remind you to "${task}" in ${val}${unit}.`
        };
    }

    return null;
}

module.exports = { processReminder };
