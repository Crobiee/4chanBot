const { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const config = require('./config');
const fourchan = require('./fourchan');
const utils = require('./utils');
const commandModule = require('./commands');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

function log(message) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${timestamp}] ${message}`);
}

async function processThread(board, threadId, channel) {
    const posts = await fourchan.fetchThread(board, threadId);
    if (!posts) return;

    // First post usually contains the subject
    const op = posts[0];
    const threadTitle = op.sub || `Thread ${threadId}`;

    for (const post of posts) {
        if (post.tim && post.ext && (post.ext === '.webm' || post.ext === '.mp4' || post.ext === '.gif')) {
            const uniqueId = `${board}-${threadId}-${post.no}`;
            if (utils.hasSeen(uniqueId)) continue; // Skip duplicates

            const fileUrl = `https://i.4cdn.org/${board}/${post.tim}${post.ext}`;
            const postUrl = `https://boards.4chan.org/${board}/thread/${threadId}#p${post.no}`;
            log(`[${board}] Found new video: ${fileUrl}`);

            let comment = post.com ? post.com.replace(/<br>/g, '\n').replace(/<[^>]*>?/gm, '') : '';
            if (comment.length > 200) comment = comment.substring(0, 197) + '...';

            const embed = new EmbedBuilder()
                .setTitle(post.sub || threadTitle)
                .setURL(postUrl)
                .setDescription(comment || 'No comment')
                .setAuthor({ name: post.name || 'Anonymous' })
                .setFooter({ text: `/${board}/ - ${post.no}` })
                .setColor(0x00FF00);

            // Check file size (25MB limit)
            const MAX_SIZE = 25 * 1024 * 1024;

            if (post.fsize > MAX_SIZE) {
                log(`[${board}] File too large (${(post.fsize / 1024 / 1024).toFixed(2)}MB). Posting link.`);
                await channel.send({ content: `**File too large to upload:**\n${fileUrl}`, embeds: [embed] });
                utils.markSeen(uniqueId);
            } else {
                const fileData = await utils.downloadFile(fileUrl);
                if (fileData) {
                    try {
                        const attachment = new AttachmentBuilder(fileData, { name: `${post.tim}${post.ext}` });

                        // Apply spoiler setting
                        if (config.spoilerMode) {
                            attachment.setSpoiler(true);
                        }

                        await channel.send({ embeds: [embed], files: [attachment] });
                        utils.markSeen(uniqueId);
                        log(`[${board}] Posted ${post.tim}${post.ext} to Discord.`);
                    } catch (discordErr) {
                        console.error('Error posting to Discord:', discordErr.message);
                    }
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
        log('No keywords set. Waiting...');
        return;
    }

    const currentBoards = config.boards;
    if (currentBoards.length === 0) {
        log('No boards set. Defaulting to gif.');
        config.addBoard('gif');
    }

    for (const board of currentBoards) {
        log(`Fetching catalog for /${board}/...`);
        const catalog = await fourchan.fetchCatalog(board);

        const interestingThreads = [];
        for (const page of catalog) {
            for (const thread of page.threads) {
                if (fourchan.isInterestingThread(thread, currentKeywords)) {
                    interestingThreads.push(thread.no);
                }
            }
        }

        log(`[${board}] Found ${interestingThreads.length} interesting threads.`);

        for (const threadId of interestingThreads) {
            await processThread(board, threadId, channel);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

// Graceful Shutdown
const handleShutdown = () => {
    log('Shutting down...');
    utils.saveHistory(); // Force save history
    process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

client.once('ready', () => {
    log(`Logged in as ${client.user.tag}!`);

    // Set Activity
    client.user.setActivity(`Watching /${config.boards.join(', /')}/`, { type: 3 }); // Watching

    // Prune history on startup
    utils.pruneHistory();

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
