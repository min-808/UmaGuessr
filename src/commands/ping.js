const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with the bot ping'),
    //.setDescription('TEST COMMAND'),


    run: async ({ interaction }) => {

        await interaction.deferReply()

        const reply = await interaction.fetchReply();
        const ping = reply.createdTimestamp - interaction.createdTimestamp

        interaction.editReply(`Pong! (${ping}ms)`)
    }
    
}