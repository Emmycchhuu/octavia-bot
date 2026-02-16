
/**
 * Octavia Local Brain: Todo List
 * Manage tasks locally.
 */
const fs = require('fs');
const path = require('path');

const TODO_FILE = path.join(__dirname, 'todo.json');

function getTodos() {
    if (!fs.existsSync(TODO_FILE)) {
        fs.writeFileSync(TODO_FILE, '{}');
    }
    return JSON.parse(fs.readFileSync(TODO_FILE, 'utf8'));
}

function saveTodos(todos) {
    fs.writeFileSync(TODO_FILE, JSON.stringify(todos, null, 2));
}

function processTodo(message, contactName) {
    const clean = message.toLowerCase().trim();
    const todos = getTodos();
    if (!todos[contactName]) todos[contactName] = [];

    // ADD TASK: "todo buy milk" or "add task finish code"
    if (clean.startsWith('todo ') || clean.startsWith('add task ')) {
        const item = clean.replace(/^(todo|add task)/, '').trim();
        todos[contactName].push({ task: item, done: false, date: new Date().toLocaleDateString() });
        saveTodos(todos);
        return `✅ *Task Added:* "${item}"`;
    }

    // LIST TASKS: "my tasks", "todo list", "list tasks"
    if (clean === 'my tasks' || clean === 'todo list' || clean === 'list tasks') {
        if (todos[contactName].length === 0) return `📝 You have no pending tasks.`;

        const list = todos[contactName].map((t, i) => {
            const status = t.done ? '✅' : '⬜';
            return `${i + 1}. ${status} ${t.task}`;
        }).join('\n');
        return `📝 *Your To-Do List:*\n\n${list}`;
    }

    // CHECK TASK: "check task 1", "finish task 2"
    const checkMatch = clean.match(/(check|finish|done|complete) task (\d+)/);
    if (checkMatch) {
        const index = parseInt(checkMatch[2]) - 1;
        if (todos[contactName][index]) {
            todos[contactName][index].done = true;
            saveTodos(todos);
            return `✅ Marked task *"${todos[contactName][index].task}"* as complete!`;
        } else {
            return `❌ Task number ${index + 1} not found.`;
        }
    }

    // DELETE TASK: "remove task 1", "delete task 1"
    const delMatch = clean.match(/(remove|delete) task (\d+)/);
    if (delMatch) {
        const index = parseInt(delMatch[2]) - 1;
        if (todos[contactName][index]) {
            const removed = todos[contactName].splice(index, 1);
            saveTodos(todos);
            return `🗑️ Removed task: *"${removed[0].task}"*`;
        }
    }

    // CLEAR ALL
    if (clean === 'clear tasks') {
        todos[contactName] = [];
        saveTodos(todos);
        return `🗑️ All tasks cleared.`;
    }

    return null;
}

module.exports = { processTodo };
