require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// Default state
let state = {
    keywords: [],
    admins: []
};

// Load state
if (fs.existsSync(DATA_FILE)) {
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const loaded = JSON.parse(raw);
        state.keywords = loaded.keywords || [];
        state.admins = loaded.admins || [];
    } catch (err) {
        console.error('Error loading data.json:', err);
    }
} else {
    // Attempt to load from legacy .env if data.json doesn't exist
    if (process.env.KEYWORDS) {
        state.keywords = process.env.KEYWORDS.split(',').map(k => k.trim());
        saveState();
    }
}

function saveState() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error('Error saving data.json:', err);
    }
}

module.exports = {
    discordToken: process.env.DISCORD_TOKEN,
    discordChannelId: process.env.DISCORD_CHANNEL_ID,
    discordClientId: process.env.DISCORD_CLIENT_ID,
    discordOwnerId: process.env.DISCORD_OWNER_ID,
    fourChanBoard: 'gif',

    get keywords() { return state.keywords; },

    addKeyword(keyword) {
        if (!state.keywords.includes(keyword)) {
            state.keywords.push(keyword);
            saveState();
            return true;
        }
        return false;
    },

    removeKeyword(keyword) {
        const initialLen = state.keywords.length;
        state.keywords = state.keywords.filter(k => k !== keyword);
        if (state.keywords.length !== initialLen) {
            saveState();
            return true;
        }
        return false;
    },

    addAdmin(userId) {
        if (!state.admins.includes(userId)) {
            state.admins.push(userId);
            saveState();
            return true;
        }
        return false;
    },

    isAdmin(userId) {
        return userId === process.env.DISCORD_OWNER_ID || state.admins.includes(userId);
    }
};
