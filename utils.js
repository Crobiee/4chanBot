const axios = require('axios');
const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, 'history.json');

// Memory storage: Map<string, number> (ID -> Timestamp)
let history = new Map();

// Helper to load history
function loadHistory() {
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
            const data = JSON.parse(raw);

            // Migration: If array (old format), convert to Map with now()
            if (Array.isArray(data)) {
                console.log('Migrating history from Array to Map...');
                const now = Date.now();
                data.forEach(id => history.set(id, now));
            } else if (Array.isArray(data[0])) {
                // Checks if it's an array of tuples (Map JSON format)
                history = new Map(data);
            } else {
                // Fallback or empty object
                history = new Map();
            }
        } catch (err) {
            console.error('Error loading history:', err);
        }
    }
}

// Initial load
loadHistory();

function saveHistory() {
    try {
        // Serialize Map to Array of tuples
        const data = Array.from(history.entries());
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(data));
    } catch (err) {
        console.error('Error saving history:', err);
    }
}

function hasSeen(id) {
    return history.has(id);
}

function markSeen(id) {
    history.set(id, Date.now());
    saveHistory();
}

function pruneHistory(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // Default 7 days
    const now = Date.now();
    let prunedCount = 0;

    for (const [id, timestamp] of history.entries()) {
        if (now - timestamp > maxAgeMs) {
            history.delete(id);
            prunedCount++;
        }
    }

    if (prunedCount > 0) {
        console.log(`Pruned ${prunedCount} old entries from history.`);
        saveHistory();
    }
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

module.exports = { hasSeen, markSeen, downloadFile, pruneHistory, saveHistory };
