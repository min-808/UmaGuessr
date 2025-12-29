const { getMongoClient } = require('../connect-db.js');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const img = 'filter'

module.exports = {
    name: 'filter',
    description: `Toggle the content filter`,
    aliases: ['safe'],

    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Toggle the content filter'),

    run: async ({ interaction, client }) => {
        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .setTitle(`Filter`)

        try {
            if (!interaction.guild) {
                return interaction.reply({
                    content: "This command can only be used in servers, not in DMs.",
                    flags: 64
                });
            }

            await interaction.deferReply()

            if ((!interaction.member.permissions.has("Administrator")) && (!interaction.member.permissions.has("ManageGuild"))) {
                embed.addFields({
                    name: '\n',
                    value: "You need the **Administrator** or **Manage Server** permission to set the content filter"
                })
                await interaction.editReply({ embeds: [embed], files: [file] });

                return
            } else {
                var client_db = new getMongoClient()
                var database = client_db.db("uma");
                var ids = database.collection("filters")

                var broadSearch = await ids.findOne({ server_id: interaction.guild.id })

                if ((broadSearch == null) || (broadSearch['filter'] == true)) { // no entry, so server is on safe-mode. change to unfiltered mode and add entry to cache & db
                    await ids.updateOne({ server_id: interaction.guild.id }, { $set: { filter: false }}, { upsert: true })
                    client.filterCache.set(interaction.guild.id, false)

                    embed.addFields({
                        name: '\n',
                        value: `Successfully **disabled** the content filter, suggestive images **may show** in games\n\nUse the \`/filter\` command to turn the filter back on`
                    })
                } else { // entry found and filter is off, turn filter back on
                    await ids.updateOne({ server_id: interaction.guild.id }, { $set: { filter: true }} )
                    client.filterCache.set(interaction.guild.id, true)

                    embed.addFields({
                        name: '\n',
                        value: `Successfully **enabled** the content filter, suggestive images will **no longer show** in games\n\nUse the \`/filter\` command to turn the filter off`
                    })
                }

                await interaction.editReply({ embeds: [embed], files: [file] });
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