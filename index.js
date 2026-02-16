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

        // ** 1. Friendly Introduction Check (With Buttons/List) **
        const history = await chat.fetchMessages({ limit: 5 });
        const isNewContact = history.length <= 1;

        if (isNewContact) {
            // Fallback to Text Menu (Buttons are unreliable on some WA versions)
            const introMsg = `Hi! I'm *Octavia* 👋, Emmy's AI Assistant.\n\n` +
                `Emmy is busy coding, but I'm here to help! Reply with a number:\n\n` +
                `1️⃣ *Schedule a Meeting*\n` +
                `2️⃣ *View Portfolio*\n` +
                `3️⃣ *Just Chatting*\n\n` +
                `_Powered by Emmy D West_`;

            await chat.sendMessage(introMsg);
        }

        console.log(`Received message from ${contact.pushname}: ${msg.body}`);

        // ** 2. Handle Menu Responses & Scheduling **
        const lowerMsg = msg.body.toLowerCase().trim();

        // Check for specific numbers or keywords
        if (['1', 'schedule', 'meeting', 'meet'].some(k => lowerMsg.includes(k))) {
            const meetingId = Math.random().toString(36).substring(7).toUpperCase();

            const meetingRequest = {
                id: meetingId,
                contactName: contact.pushname || contact.name,
                chatId: chat.id._serialized,
                message: msg.body,
                timestamp: Date.now()
            };
            saveMeeting(meetingRequest);
            await client.sendMessage(client.info.wid._serialized,
                `📅 *NEW MEETING REQUEST - ${meetingId}*\nFrom: ${meetingRequest.contactName}\nMessage: "${meetingRequest.message}"\nReply: !bot approve/deny ${meetingId}`
            );
        }

        // ** 3. The Local Brain (Offline Intelligence) 🧠 **
        // Checks Math, Static Knowledge, and simple rules BEFORE calling Gemini
        const { processLocalBrain } = require('./brain/index');

        // Check "Doorman" rules first (Hi/Hello)
        const simpleRules = {
            'hi': ['Hey there! 👋', 'Sup?', 'Hello!', 'Hi!'],
            'hello': ['Hi there!', 'Greetings.', 'Hello to you too.'],
            'thanks': ['No problem.', 'You got it.', 'Anytime.', 'Happy to help.'],
            'thank you': ['You are welcome.', 'No worries!', 'Sure thing.'],
            'lol': ['😂', 'Hehe.', 'lol indeed.'],
            'ok': ['👍', 'Cool.', 'Okay.'],
            'bye': ['See ya.', 'Later!', 'Bye bye.']
        };

        if (simpleRules[lowerMsg]) {
            const reply = simpleRules[lowerMsg][Math.floor(Math.random() * simpleRules[lowerMsg].length)];
            await chat.sendMessage(reply);
            return;
        }

        // Check Advanced Local Brain (Math, Facts, Tools)
        const localReply = processLocalBrain(lowerMsg);
        if (localReply) {
            // Handle Action Objects (like Reminders)
            if (typeof localReply === 'object' && localReply.type === 'ACTION_REMINDER') {
                await chat.sendMessage(localReply.reply);

                // Set the timer
                setTimeout(async () => {
                    const mt = await msg.getContact(); // Refresh contact check
                    await client.sendMessage(msg.from, `⏰ *REMINDER:* ${localReply.task}\n\n(Set pending timer completed)`);
                }, localReply.ms);

                return;
            }

            // Handle Standard Text Replies
            await chat.sendMessage(localReply);
            console.log(`[Local Brain] Replied: ${localReply}`);
            return;
        }

        // ** 4. Handle Media (Vision & Voice) **
        let mediaData = null;
        let mediaType = null;

        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            if (media) {
                if (media.mimetype.startsWith('image/')) {
                    mediaData = media.data;
                    mediaType = media.mimetype;
                    console.log('Processed Image');
                } else if (media.mimetype.startsWith('audio/')) {
                    mediaData = media.data;
                    mediaType = media.mimetype;
                    console.log('Processed Audio');
                }
            }
        }

        // Delay for realism
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Generate Smart Response (Text + Vision + Voice)
        const response = await generateSmartResponse(msg.body, contact.pushname || contact.name || 'Friend', mediaData, mediaType);

        if (response) {
            await chat.sendMessage(response);
            console.log(`Octavia replied to ${contact.pushname}: ${response}`);
        }
    }
});

// CRITICAL FIX: Ensure we do NOT listen to status_broadcast
// client.on('status_broadcast', async (msg) => { ... });

client.initialize();
