const { SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const thugCommand = new SlashCommandBuilder()
    .setName('thug')
    .setDescription('Manage ThugBot configuration')
    .addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add a keyword to monitor')
            .addStringOption(option => option.setName('keyword').setDescription('The keyword').setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('remove')
            .setDescription('Remove a monitored keyword')
            .addStringOption(option => option.setName('keyword').setDescription('The keyword').setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand
            .setName('list')
            .setDescription('List all monitored keywords'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('addadmin')
            .setDescription('Add a new bot admin by User ID')
            .addStringOption(option => option.setName('userid').setDescription('The Discord User ID').setRequired(true)));

async function handleThugCommand(interaction) {
    if (!config.isAdmin(interaction.user.id)) {
        return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
        case 'add': {
            const keyword = interaction.options.getString('keyword');
            if (config.addKeyword(keyword)) {
                await interaction.reply({ content: `Added keyword: **${keyword}**`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Keyword **${keyword}** is already being monitored.`, ephemeral: true });
            }
            break;
        }
        case 'remove': {
            const keyword = interaction.options.getString('keyword');
            if (config.removeKeyword(keyword)) {
                await interaction.reply({ content: `Removed keyword: **${keyword}**`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Keyword **${keyword}** was not found.`, ephemeral: true });
            }
            break;
        }
        case 'list': {
            const keywords = config.keywords;
            const listStr = keywords.length > 0 ? keywords.join(', ') : 'No keywords set.';
            await interaction.reply({ content: `**Current Keywords:** ${listStr}`, ephemeral: true });
            break;
        }
        case 'addadmin': {
            const newAdminId = interaction.options.getString('userid');
            if (config.addAdmin(newAdminId)) {
                await interaction.reply({ content: `Added User ID **${newAdminId}** as admin.`, ephemeral: true });
            } else {
                await interaction.reply({ content: `User ID **${newAdminId}** is already an admin.`, ephemeral: true });
            }
            break;
        }
        default:
            await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
    }
}

module.exports = {
    commands: [thugCommand], // Export as array for registration
    handlers: {
        thug: handleThugCommand
    }
};
