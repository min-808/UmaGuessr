const { getMongoClient } = require('../connect-db.js');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { aliases } = require('./pd.js');

const img = 'filter'

module.exports = {
    name: 'filter',
    description: `Toggle the content filter`,
    aliases: ['safe'],

    run: async ({ message, client }) => {
        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .setTitle(`Filter`)

        try {
            if ((!message.member.permissions.has("Administrator")) && (!message.member.permissions.has("ManageGuild"))) {
                embed.addFields({
                    name: '\n',
                    value: "You need the **Administrator** or **Manage Server** permission to set the content filter"
                })
                await message.channel.send({ embeds: [embed], files: [file] });

                return
            } else {
                var client_db = new getMongoClient()
                var database = client_db.db("uma");
                var ids = database.collection("filters")

                var broadSearch = await ids.findOne({ server_id: message.guild.id })
                
                if ((broadSearch == null) || (broadSearch['filter'] == true)) { // no entry, so server is on safe-mode. change to unfiltered mode and add entry to cache & db
                    await ids.updateOne({ server_id: message.guild.id }, { $set: { filter: false }}, { upsert: true })
                    client.filterCache.set(message.guild.id, false)

                    embed.addFields({
                        name: '\n',
                        value: `Successfully **disabled** the content filter, suggestive images **may show** in games\n\nUse the \`!filter\` command to turn the filter back on`
                    })
                } else { // entry found and filter is off, turn filter back on
                    await ids.updateOne({ server_id: message.guild.id }, { $set: { filter: true }} )
                    client.filterCache.set(message.guild.id, true)

                    embed.addFields({
                        name: '\n',
                        value: `Successfully **enabled** the content filter, suggestive images will **no longer show** in games\n\nUse the \`!filter\` command to turn the filter off`
                    })
                }

                await message.channel.send({ embeds: [embed], files: [file] })
            }
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `**Unable to send embed**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}