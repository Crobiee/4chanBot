const { REST, Routes } = require('discord.js');
const config = require('./config');
const commandModule = require('./commands');

const commands = commandModule.commands.map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(config.discordToken);

(async () => {
    try {
        if (!config.discordClientId) {
            console.error('Error: DISCORD_CLIENT_ID is missing in setup.');
            process.exit(1);
        }

        console.log('Started refreshing application (/) commands.');

        // Registers commands globally. 
        // Note: Global updates can take up to an hour. For instant dev, use guild-specific registration, 
        // but user wanted general ease of use.
        await rest.put(
            Routes.applicationCommands(config.discordClientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
