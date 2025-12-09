const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const config = require('./config');
const fourchan = require('./fourchan');
const utils = require('./utils');
const commandModule = require('./commands');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

async function processThread(threadId, channel) {
    const posts = await fourchan.fetchThread(threadId);
    if (!posts) return;

    for (const post of posts) {
        if (post.tim && post.ext && (post.ext === '.webm' || post.ext === '.mp4' || post.ext === '.gif')) {
            const uniqueId = `${threadId}-${post.no}`;
            if (utils.hasSeen(uniqueId)) continue; // Skip duplicates

            const fileUrl = `https://i.4cdn.org/${config.fourChanBoard}/${post.tim}${post.ext}`;
            console.log(`Found new video: ${fileUrl}`);

            const fileData = await utils.downloadFile(fileUrl);
            if (fileData) {
                try {
                    const attachment = new AttachmentBuilder(fileData, { name: `${post.tim}${post.ext}` });
                    await channel.send({ content: `Source: <https://boards.4chan.org/${config.fourChanBoard}/thread/${threadId}#p${post.no}>`, files: [attachment] });
                    utils.markSeen(uniqueId);
                    console.log(`Posted ${post.tim}${post.ext} to Discord.`);
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

    // Dynamic keyword fetch
    const currentKeywords = config.keywords;
    if (currentKeywords.length === 0) {
        console.log('No keywords set. Waiting...');
        return;
    }

    console.log('Fetching catalog...');
    const catalog = await fourchan.fetchCatalog();

    const interestingThreads = [];
    for (const page of catalog) {
        for (const thread of page.threads) {
            if (fourchan.isInterestingThread(thread, currentKeywords)) {
                interestingThreads.push(thread.no);
            }
        }
    }

    console.log(`Found ${interestingThreads.length} interesting threads.`);

    for (const threadId of interestingThreads) {
        await processThread(threadId, channel);
        await new Promise(resolve => setTimeout(resolve, 1500));
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    runBotLoop();
    setInterval(runBotLoop, 5 * 60 * 1000);
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
