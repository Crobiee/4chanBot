const axios = require('axios');
const config = require('./config');

const BASE_URL = 'https://a.4cdn.org';

async function fetchCatalog() {
    try {
        // Cache buster to prevent stale data
        const url = `${BASE_URL}/${config.fourChanBoard}/catalog.json?t=${Date.now()}`;
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching 4chan catalog:', error.message);
        return [];
    }
}

async function fetchThread(threadId) {
    try {
        const url = `${BASE_URL}/${config.fourChanBoard}/thread/${threadId}.json`;
        const response = await axios.get(url);
        return response.data.posts || [];
    } catch (error) {
        console.error(`Error fetching thread ${threadId}:`, error.message);
        return null;
    }
}

function isInterestingThread(thread, keywords) {
    if (!thread.sub && !thread.com) return false;
    const content = (thread.sub || '') + ' ' + (thread.com || '');
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
}

module.exports = { fetchCatalog, fetchThread, isInterestingThread };
