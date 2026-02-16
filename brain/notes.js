
/**
 * Octavia Local Brain: Notes & Memory
 * Allows users to save small notes to a local JSON file.
 */
const fs = require('fs');
const path = require('path');

const NOTES_FILE = path.join(__dirname, '..', 'notes.json');

function getNotes() {
    if (!fs.existsSync(NOTES_FILE)) {
        fs.writeFileSync(NOTES_FILE, '{}');
    }
    return JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
}

function saveNote(contact, text) {
    const notes = getNotes();
    if (!notes[contact]) notes[contact] = [];
    notes[contact].push({
        text,
        date: new Date().toLocaleString()
    });
    fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

function processNotes(message, contactName) {
    const clean = message.toLowerCase().trim();

    // SAVE NOTE: "note: buy milk" or "save note meeting at 5"
    if (clean.startsWith('note:') || clean.startsWith('save note')) {
        const content = clean.replace(/^(note:|save note)/, '').trim();
        if (content) {
            saveNote(contactName, content);
            return `📝 *Note Saved!* I've added that to your personal notebook.`;
        }
    }

    // READ NOTES: "my notes" or "read notes"
    if (clean === 'my notes' || clean === 'read notes' || clean === 'check notes') {
        const notes = getNotes();
        const userNotes = notes[contactName];

        if (!userNotes || userNotes.length === 0) {
            return `📓 You don't have any saved notes yet. Reply with "note: [text]" to save one!`;
        }

        const list = userNotes.slice(-5).map((n, i) => `${i + 1}. ${n.text} _(${n.date})_`).join('\n');
        return `📓 *Your Recent Notes:*\n\n${list}`;
    }

    // CLEAR NOTES: "clear notes"
    if (clean === 'clear notes') {
        const notes = getNotes();
        notes[contactName] = [];
        fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
        return `🗑️ *Notes Cleared.* Your notebook is empty.`;
    }

    return null;
}

module.exports = { processNotes };
