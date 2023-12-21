const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your stellar jade balance'),
    //.setDescription('TEST COMMAND'),
    
    run: ({ interaction }) => {

        var amount = 0;

        // const file = new AttachmentBuilder('src/assets/thinking.png');

        const testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .addFields(
                {
                    name: "\n",
                    value: 
                    `**You have ${amount} jades!**`
                },
            )

        interaction.reply({ embeds: [testEmbed] });
    }
}