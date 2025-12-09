const { SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const fourchanCommand = new SlashCommandBuilder()
    .setName('4chan')
    .setDescription('Manage 4chanbot configuration')
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
            .setDescription('List all monitored keywords and boards'))
    .addSubcommand(subcommand =>
        subcommand
            .setName('addadmin')
            .setDescription('Add a new bot admin by User ID')
            .addStringOption(option => option.setName('userid').setDescription('The Discord User ID').setRequired(true)))
    .addSubcommandGroup(group =>
        group
            .setName('board')
            .setDescription('Manage monitored boards')
            .addSubcommand(subcommand =>
                subcommand
                    .setName('add')
                    .setDescription('Add a board (e.g., gif, w)')
                    .addStringOption(option => option.setName('board').setDescription('Board name').setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand
                    .setName('remove')
                    .setDescription('Remove a monitored board')
                    .addStringOption(option => option.setName('board').setDescription('Board name').setRequired(true))));

async function handleFourchanCommand(interaction) {
    if (!config.isAdmin(interaction.user.id)) {
        return interaction.reply({ content: 'You are not authorized to use this command.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup(); // 'board' or null

    if (group === 'board') {
        const board = interaction.options.getString('board');
        if (subcommand === 'add') {
            if (config.addBoard(board)) {
                await interaction.reply({ content: `Added board: **/${board}/**`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Board **/${board}/** is already being monitored.`, ephemeral: true });
            }
        } else if (subcommand === 'remove') {
            if (config.removeBoard(board)) {
                await interaction.reply({ content: `Removed board: **/${board}/**`, ephemeral: true });
            } else {
                await interaction.reply({ content: `Board **/${board}/** was not found.`, ephemeral: true });
            }
        }
        return;
    }

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
            const boards = config.boards;
            const kwList = keywords.length > 0 ? keywords.join(', ') : 'None';
            const bdList = boards.length > 0 ? boards.join(', ') : 'None';

            await interaction.reply({ content: `**Keywords:** ${kwList}\n**Boards:** ${bdList}`, ephemeral: true });
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
    commands: [fourchanCommand],
    handlers: {
        '4chan': handleFourchanCommand
    }
};
