const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
require('dotenv').config();

// Modules
const { generateSmartResponse } = require('./ai');
const { postToStatus } = require('./features');
const { initScheduler } = require('./scheduler');
const { getCryptoPrice, getDiskSpace } = require('./tools');

// Helper to load settings
function getPersonality() {
    return JSON.parse(fs.readFileSync('./personality.json', 'utf8'));
}

// Helper to handle meetings
function getMeetings() {
    if (!fs.existsSync('./meetings.json')) fs.writeFileSync('./meetings.json', '[]');
    return JSON.parse(fs.readFileSync('./meetings.json', 'utf8'));
}

function saveMeeting(meeting) {
    const meetings = getMeetings();
    meetings.push(meeting);
    fs.writeFileSync('./meetings.json', JSON.stringify(meetings, null, 2));
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE TO LOGIN:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Octavia is ready and online!');
    initScheduler(client);
});

client.on('message_create', async (msg) => {
    const personality = getPersonality();

    // Handling self-chat commands
    if (msg.fromMe && msg.body.startsWith('!bot')) {
        const parts = msg.body.split(' ');
        const command = parts[1];

        switch (command) {
            case 'stop':
                personality.ai_active = false;
                fs.writeFileSync('./personality.json', JSON.stringify(personality, null, 2));
                await msg.reply('Octavia deactivated. Emmy is now handling messages.');
                break;
            case 'start':
                personality.ai_active = true;
                fs.writeFileSync('./personality.json', JSON.stringify(personality, null, 2));
                await msg.reply('Octavia activated! I will help engage your contacts.');
                break;
            case 'status':
                await msg.reply(`Octavia Status: ${personality.ai_active ? 'ACTIVE' : 'INACTIVE'}\nMode: ${personality.mode.toUpperCase()}`);
                break;
            case 'mode':
                const newMode = parts[2]?.toLowerCase();
                if (['professional', 'savage', 'ghost'].includes(newMode)) {
                    personality.mode = newMode;
                    fs.writeFileSync('./personality.json', JSON.stringify(personality, null, 2));
                    await msg.reply(`Mode switched to: ${newMode.toUpperCase()}`);
                } else {
                    await msg.reply('Invalid mode. Choose: professional, savage, ghost.');
                }
                break;
            case 'price':
                const symbol = parts[2] || 'bitcoin';
                const price = await getCryptoPrice(symbol);
                await msg.reply(price || `I couldn't find the price for ${symbol}.`);
                break;
            case 'disk':
                const diskInfo = await getDiskSpace();
                await msg.reply(diskInfo);
                break;
            case 'post':
                const statusText = parts.slice(2).join(' ');
                const success = await postToStatus(client, statusText);
                await msg.reply(success ? 'Status posted successfully!' : 'Failed to post status.');
                break;
            case 'remember':
                const fact = parts.slice(2).join(' ');
                const key = `fact_${Date.now()}`;
                personality.memory[key] = fact;
                fs.writeFileSync('./personality.json', JSON.stringify(personality, null, 2));
                await msg.reply(`Got it! I've added that to my knowledge base. I'll remember it forever! 🧠`);
                break;
            case 'approve':
            case 'deny':
                const meetingId = parts[2];
                const meetings = getMeetings();
                const meetingIndex = meetings.findIndex(m => m.id === meetingId);

                if (meetingIndex !== -1) {
                    const meeting = meetings[meetingIndex];
                    const contactChat = await client.getChatById(meeting.chatId);

                    if (command === 'approve') {
                        await contactChat.sendMessage(`Hello! Emmy D West has reviewed your request and will be with you shortly. 😊`);
                        await msg.reply(`Meeting ${meetingId} APPROVED. Notification sent to ${meeting.contactName}.`);
                    } else {
                        await contactChat.sendMessage(`Hi there! Emmy D West is unfortunately unable to meet right now due to his tight schedule. He'll reach out when he's free!`);
                        await msg.reply(`Meeting ${meetingId} DENIED. Notification sent to ${meeting.contactName}.`);
                    }

                    meetings.splice(meetingIndex, 1);
                    fs.writeFileSync('./meetings.json', JSON.stringify(meetings, null, 2));
                } else {
                    await msg.reply('Meeting ID not found.');
                }
                break;
            default:
                await msg.reply('Unknown command. Try !bot status, !bot mode, etc.');
        }
        return;
    }

    // Logic for replying to others
    if (!msg.fromMe && personality.ai_active && personality.mode !== 'ghost') {
        const chat = await msg.getChat();
        const contact = await msg.getContact();

        if (chat.isGroup) return;

        console.log(`Received message from ${contact.pushname}: ${msg.body}`);

        // Detect scheduling intent
        const lowerMsg = msg.body.toLowerCase();
        const isScheduling = ['schedule', 'meeting', 'meet emmy', 'talk to emmy', 'book time'].some(keyword => lowerMsg.includes(keyword));

        if (isScheduling) {
            const meetingId = Math.random().toString(36).substring(7).toUpperCase();
            const meetingRequest = {
                id: meetingId,
                contactName: contact.pushname || contact.name,
                chatId: chat.id._serialized,
                message: msg.body,
                timestamp: Date.now()
            };
            saveMeeting(meetingRequest);

            // Notify Emmy in self-chat
            await client.sendMessage(client.info.wid._serialized,
                `📅 *NEW MEETING REQUEST*\n\n` +
                `From: ${meetingRequest.contactName}\n` +
                `Message: "${meetingRequest.message}"\n\n` +
                `Reply with:\n` +
                `*!bot approve ${meetingId}*\n` +
                `*!bot deny ${meetingId}*`
            );
        }

        await chat.sendStateTyping();
        await new Promise(resolve => setTimeout(resolve, 3000));

        const response = await generateSmartResponse(msg.body, contact.pushname || contact.name || 'Friend');

        if (response) {
            await chat.sendMessage(response);
            console.log(`Octavia replied to ${contact.pushname}: ${response}`);
        }
    }
});

client.initialize();
