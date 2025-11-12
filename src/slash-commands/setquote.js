const { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } = require('obscenity');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getMongoClient } = require('../connect-db.js')

const setup = require('../../firstinit');

const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

const img = "discord"

module.exports = {
    name: 'setquote',
    aliases: ['quote', 'sq'],
    description: 'Set a quote for your profile',

    data: new SlashCommandBuilder()
        .setName('setquote')
        .setDescription('Set a quote for your profile')
        .addStringOption(option =>
            option.setName('quote')
                .setDescription('Enter a quote to put on your profile')
                .setRequired(false)
    ),
    
    run: async ({ interaction, client }) => {
        const user = interaction.user

        try {
            await interaction.deferReply()

            var client_db = new getMongoClient();
            const database = client_db.db("uma");
            const ids = database.collection("profiles");
            var discordID = BigInt(user.id);

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

            let embed;
            let linkRegex = /https?:\/\/\S{2,}/

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Set Profile Quote")
                .setThumbnail(`attachment://${img}.png`)

            if (interaction.options.getString('quote') == null) {
                embed.addFields(
                    {
                        name: "\n",
                        value: "Your profile quote has been **reset**"
                    }
                )

                await ids.updateOne({ discord_id: discordID },
                    { $set: { quote: null } },
                    { upsert: true }
                );
            } else if (interaction.options.getString('quote').length > 75) {
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Unable to set profile quote**\n\nThe text is longer than 75 characters"
                    }
                )
            } else if (matcher.hasMatch(interaction.options.getString('quote'))) { // bad word checker
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Unable to set profile quote**\n\nThe text contains profanity"
                    }
                )

                console.log(`Blocked: User ID ${user} tried changing their quote to: ${interaction.options.getString('quote')}`)
            } else if (linkRegex.test(interaction.options.getString('quote'))) {
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Unable to set profile quote**\n\nThe text contains a clickable link"
                    }
                )
            } else {
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Successfully changed profile quote**"
                    }
                )

                await ids.updateOne({ discord_id: discordID },
                    { $set: { quote: interaction.options.getString('quote') } },
                    { upsert: true }
                );
            }

            await interaction.editReply({ embeds: [embed], files: [file] });
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`**Unable to send embed**\n\nPlease check the bot's permissions and try again`);
                } else {
                    await interaction.reply({ content: `**Unable to send embed**\n\nPlease check the bot's permissions and try again`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}