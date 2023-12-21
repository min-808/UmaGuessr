const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily stellar jades!'),
    //.setDescription('TEST COMMAND'),
    
    run: ({ interaction }) => {

        // const file = new AttachmentBuilder('src/assets/thinking.png');

        const testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .setTimestamp()
            .addFields(
                {
                    name: "\n",
                    value: 
                    "**You have successfully claimed your daily 500 jades!**"
                },
            )
            .setFooter({ text: "You can claim again in 24 hours" })

        interaction.reply({ embeds: [testEmbed] });
    }
}