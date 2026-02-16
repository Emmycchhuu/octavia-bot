
/**
 * Octavia Local Brain: System Monitor
 * Checks VPS health.
 */
const os = require('os');

function formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

function processSystem(query) {
    const q = query.toLowerCase();

    if (q.includes('system status') || q.includes('server health') || q.includes('ram usage')) {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const uptime = (os.uptime() / 3600).toFixed(1);

        return `🖥️ *Octavia Systems Diagnostics*\n\n` +
            `🔋 *Uptime:* ${uptime} Hours\n` +
            `💾 *RAM:* ${formatBytes(usedMem)} / ${formatBytes(totalMem)}\n` +
            `🧠 *CPU Load:* ${os.loadavg()[0].toFixed(2)}%\n` +
            `🐧 *OS:* ${os.type()} ${os.release()}`;
    }

    return null;
}

module.exports = { processSystem };
