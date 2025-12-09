const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');
const commandModule = require('./commands');

// Base commands defined in commandModule
const existingCommands = commandModule.commands.map(cmd => cmd.toJSON());

// Additional commands (if any are separate, but currently we define them all in commands.js for consistency)
// Ideally, we updates commands.js to include everything, but let's stick to the current pattern
// where commands are exported from commands.js.
// Wait, the previous edit tried to mix new builders here. Let's rely on commands.js being the source of truth.
// We will simply load whatever is in commands.js.

const commands = commandModule.commands.map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(config.discordToken);

(async () => {
    try {
        if (!config.discordClientId) {
            console.error('Error: DISCORD_CLIENT_ID is missing in setup.');
            process.exit(1);
        }

        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(config.discordClientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
