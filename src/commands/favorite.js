const { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } = require('obscenity');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
const { getMongoClient } = require('../connect-db.js')
const path = require("path")

const setup = require('../../firstinit');

const img = "favorite"

module.exports = {
    name: 'favorite',
    aliases: ['fav', 'favs', 'favorites'],
    description: 'Set a favorite uma for your profile',
    
    run: async ({ message, args }) => {
        const user = message.author

        try {
            var client_db = new getMongoClient();
            const database = client_db.db("uma");
            const ids = database.collection("profiles");
            var discordID = BigInt(user.id);

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);
            
            var globalList = require('../../src/assets/global-list.json')
            var JPList = require('../../src/assets/jp-list.json')
            var bothLists = globalList.concat(JPList)

            var charToSearch = message.content.slice(message.content.indexOf(' ') + 1).trim().toLowerCase().replace(/\s+/g, '')
            let found = false
            var id
            var charName

            const getFavs = await ids.findOne({ discord_id: discordID }, {
                projection: {
                    _id: 0,
                    favorites: 1,
                    max_favorites: 1,
                }
            })

            const embed = new EmbedBuilder()
                .setTitle(`Set Favorite Uma`)
                .setColor('LightGrey')
                .addFields({ name: "\n", value: `\n` })

            if (args.length == 0) {
                embed.addFields(
                    {
                        name: "\n",
                        value: `Your favorite umas are: **${getFavs['favorites'].map(item => bothLists.find(entry => entry.id == item)['proper']).join(', ')}**`
                    }
                )

                await message.channel.send({ embeds: [embed] })
            } else {
                if (getFavs['favorites'].length >= getFavs['max_favorites']) {
                    embed.addFields(
                            {
                                name: "\n",
                                value: `You can only have up to **${getFavs['max_favorites']}** favorite umas`
                            }
                        )

                        await message.channel.send({ embeds: [embed] })
                        return
                } else {
                    for (let i = 0; i < bothLists.length; i++) { // We are looping through both lists to find a matching uma that holds a nickname passed in through charToSearch
                        if (bothLists[i]["names"].includes(charToSearch)) { // This will take a while :/
                            found = true
                            id = bothLists[i]["number"]
                            charName = bothLists[i]["id"]
                            properName = bothLists[i]["proper"]

                            if (id == 0) {
                                found = false
                                break
                            }

                            if (getFavs['favorites'].includes(charName)) {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `**${properName}** is already in your list of favorite umas`
                                    }
                                )

                                await message.channel.send({ embeds: [embed] })
                                return
                            } else {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `Added **${properName}** to your list of favorite umas`
                                    }
                                )

                                await ids.updateOne({ discord_id: discordID },
                                    { $push: { favorites: charName } },
                                    { upsert: true }
                                );

                                await message.channel.send({ embeds: [embed] })
                                return
                            }
                        }
                    }

                    if (!found) {
                        embed.addFields(
                            {
                                name: "\n",
                                value: `Unable to find character`
                            }
                        )

                        await message.channel.send({ embeds: [embed] })
                    }
                }
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