require('dotenv').config();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

// Default state
let state = {
    keywords: [],
    admins: [],
    boards: ['gif']
};

// Load state
try {
    if (!fs.existsSync(DATA_FILE)) {
        saveState(); // Create with defaults if missing
    } else {
        const stats = fs.statSync(DATA_FILE);
        if (stats.isDirectory()) {
            // Docker volume issue: user mounted a host path that didn't exist, so Docker made a dir.
            // We cannot fix this from code easily without changing the path, but we can warn.
            console.error('ERROR: data.json is a directory. If using Docker, ensure data.json exists on host or use a volume for the folder.');
        } else {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const loaded = JSON.parse(raw);
            state.keywords = loaded.keywords || [];
            state.admins = loaded.admins || [];
            state.boards = loaded.boards || ['gif'];
        }
    }
} catch (err) {
    console.error('Error loading data.json:', err);
}

// Migration check (if file was just created or empty)
if (state.keywords.length === 0 && process.env.KEYWORDS) {
    state.keywords = process.env.KEYWORDS.split(',').map(k => k.trim());
    saveState();
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

    get keywords() { return state.keywords; },
    get boards() { return state.boards; },

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

    addBoard(board) {
        if (!state.boards.includes(board)) {
            state.boards.push(board);
            saveState();
            return true;
        }
        return false;
    },

    removeBoard(board) {
        const initialLen = state.boards.length;
        state.boards = state.boards.filter(b => b !== board);
        if (state.boards.length !== initialLen) {
            saveState();
            return true;
        }
        return false;
    },

    isAdmin(userId) {
        return userId === process.env.DISCORD_OWNER_ID || state.admins.includes(userId);
    },

    pollingInterval: process.env.POLLING_INTERVAL ? parseInt(process.env.POLLING_INTERVAL) : 5 * 60 * 1000
};
