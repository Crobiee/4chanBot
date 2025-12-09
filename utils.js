const axios = require('axios');
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'history.json');

// Load history from file or initialize empty
let history = new Set();
if (fs.existsSync(HISTORY_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
        history = new Set(data);
    } catch (err) {
        console.error('Error loading history:', err);
    }
}

function saveHistory() {
    try {
        fs.writeFileSync(HISTORY_FILE, JSON.stringify([...history]));
    } catch (err) {
        console.error('Error saving history:', err);
    }
}

function hasSeen(id) {
    return history.has(id);
}

function markSeen(id) {
    history.add(id);
    saveHistory();
}

async function downloadFile(url) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        return response.data;
    } catch (error) {
        console.error(`Error downloading file ${url}:`, error.message);
        return null;
    }
}

module.exports = { hasSeen, markSeen, downloadFile };
