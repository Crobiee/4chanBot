const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const config = require('./config');
const fourchan = require('./fourchan');
const utils = require('./utils');
const commandModule = require('./commands');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

async function processThread(board, threadId, channel) {
    const posts = await fourchan.fetchThread(board, threadId);
    if (!posts) return;

    for (const post of posts) {
        if (post.tim && post.ext && (post.ext === '.webm' || post.ext === '.mp4' || post.ext === '.gif')) {
            const uniqueId = `${board}-${threadId}-${post.no}`;
            if (utils.hasSeen(uniqueId)) continue; // Skip duplicates

            const fileUrl = `https://i.4cdn.org/${board}/${post.tim}${post.ext}`;
            console.log(`[${board}] Found new video: ${fileUrl}`);

            const fileData = await utils.downloadFile(fileUrl);
            if (fileData) {
                try {
                    const attachment = new AttachmentBuilder(fileData, { name: `${post.tim}${post.ext}` });
                    await channel.send({ content: `Source: <https://boards.4chan.org/${board}/thread/${threadId}#p${post.no}>`, files: [attachment] });
                    utils.markSeen(uniqueId);
                    console.log(`[${board}] Posted ${post.tim}${post.ext} to Discord.`);
                } catch (discordErr) {
                    console.error('Error posting to Discord:', discordErr.message);
                }
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

async function runBotLoop() {
    const channel = client.channels.cache.get(config.discordChannelId);
    if (!channel) {
        console.error('Discord channel not found! Check ID.');
        return;
    }

    const currentKeywords = config.keywords;
    if (currentKeywords.length === 0) {
        console.log('No keywords set. Waiting...');
        return;
    }

    const currentBoards = config.boards;
    if (currentBoards.length === 0) {
        console.log('No boards set. Defaulting to gif.');
        config.addBoard('gif');
    }

    for (const board of currentBoards) {
        console.log(`Fetching catalog for /${board}/...`);
        const catalog = await fourchan.fetchCatalog(board);

        const interestingThreads = [];
        for (const page of catalog) {
            for (const thread of page.threads) {
                if (fourchan.isInterestingThread(thread, currentKeywords)) {
                    interestingThreads.push(thread.no);
                }
            }
        }

        console.log(`[${board}] Found ${interestingThreads.length} interesting threads.`);

        for (const threadId of interestingThreads) {
            await processThread(board, threadId, channel);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Slight pause between boards
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    runBotLoop();
    setInterval(runBotLoop, config.pollingInterval);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const handler = commandModule.handlers[interaction.commandName];
    if (handler) {
        try {
            await handler(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
            }
        }
    }
});

client.login(config.discordToken);
