var { MongoClient } = require("mongodb");
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const img = 'prefix'

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'prefix',
    description: `Change the bot prefix for your server`,
    aliases: ['pref'],

    run: async ({ message, args, client }) => {
        const user = message.author

        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .setTitle(`Prefix`)

        try {
            if (!message.member.permissions.has("Administrator")) {
                embed.addFields({
                    name: '\n',
                    value: "You need **Administrator** permission to set the prefix"
                })
                await message.channel.send({ embeds: [embed], files: [file] });

                return
            } else {
                var client_db = new MongoClient(uri)
                var database = client_db.db("uma");
                var ids = database.collection("prefixes")

                if (args.length < 1) {
                    embed.addFields({
                        name: '\n',
                        value: "Please provide a new prefix"
                    })
                } else {
                    if (args[0].length > 4) {
                        embed.addFields({
                            name: '\n',
                            value: "Prefixes cannot be longer than **4 characters**"
                        })
                    } else {
                        var newPrefix = args[0]
                        await ids.updateOne({ server_id: message.guild.id }, { $set: { prefix: newPrefix }}, { upsert: true })
                        client.prefixCache.set(message.guild.id, newPrefix)

                        embed.addFields({
                            name: '\n',
                            value: `Successfully changed prefix to \`${newPrefix}\``
                        })
                    }
                }

                await message.channel.send({ embeds: [embed], files: [file] });
                await client_db.close()
            }
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `Unable to send embed: **${msg}**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}