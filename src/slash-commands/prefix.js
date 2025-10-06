var { MongoClient } = require("mongodb");
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const img = 'prefix'

module.exports = {
    name: 'prefix',
    description: `Change the bot prefix for your server`,
    aliases: ['pref'],

    data: new SlashCommandBuilder()
        .setName('prefix')
        .setDescription('Change the bot prefix for your server')
        .addStringOption(option =>
            option.setName('prefix')
                .setDescription('The prefix to set for the bot (default is !)')
                .setRequired(false)
    ),
        

    run: async ({ interaction, client }) => {
        const user = interaction.user

        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .setTitle(`Prefix`)

        try {

            if (!interaction.guild) {
                return interaction.reply({
                    content: "This command can only be used in servers, not in DMs.",
                    ephemeral: true
            });
}

            await interaction.deferReply()

            if (!interaction.member.permissions.has("Administrator")) {
                embed.addFields({
                    name: '\n',
                    value: "You need **Administrator** permission to set the prefix"
                })
                await interaction.editReply({ embeds: [embed], files: [file] });

                return
            } else {
                var client_db = new MongoClient(process.env.MONGODB_URI)
                var database = client_db.db("uma");
                var ids = database.collection("prefixes")

                if (interaction.options.getString('prefix') == null) {
                    embed.addFields({
                        name: '\n',
                        value: "Please provide a new prefix"
                    })
                } else {
                    if (interaction.options.getString('prefix').length > 4) {
                        embed.addFields({
                            name: '\n',
                            value: "Prefixes cannot be longer than **4 characters**"
                        })
                    } else {
                        var newPrefix = interaction.options.getString('prefix')
                        await ids.updateOne({ server_id: interaction.guild.id }, { $set: { prefix: newPrefix }}, { upsert: true })
                        client.prefixCache.set(interaction.guild.id, newPrefix)

                        embed.addFields({
                            name: '\n',
                            value: `Successfully changed prefix to \`${newPrefix}\``
                        })
                    }
                }

                await interaction.editReply({ embeds: [embed], files: [file] });
                await client_db.close()
            }
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