const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
const { getMongoClient } = require('../connect-db.js')

const setup = require('../../firstinit');

const img = "sample"

module.exports = {
    name: 'sample',
    aliases: ['samples', 'samp'],
    description: 'Set sample umas to practice',
    
    run: async ({ message, args }) => {
        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

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

            var charToSearch = args.slice(1).join(" ").trim().toLowerCase().replace(/\s+/g, '')
            let found = false
            var id
            var charName

            const getSamples = await ids.findOne({ discord_id: discordID }, {
                projection: {
                    _id: 0,
                    sample: 1,
                }
            })

            const embed = new EmbedBuilder()
                .setTitle(`Add Sample Umas`)
                .setColor('LightGrey')
                .setThumbnail(`attachment://${img}.png`)

            if (args.length == 0) {
                if (getSamples['sample'].length == 0) {
                    embed.addFields(
                        {
                            name: "\n",
                            value: `You have no umas in your sample list.\n\nTo add, do \`!sample add (uma name)\`\nTo remove, do \`!sample remove (uma name)\``
                        }
                    )
                } else {
                    embed.addFields(
                        {
                            name: "\n",
                            value: `Your sampled umas are: \n\n**${getSamples['sample'].map(item => bothLists.find(entry => entry.id == item)['proper']).join('\n')}**`
                        }
                    )
                }

                await message.channel.send({ embeds: [embed], files: [file] })
            } else if (args.length == 1) {
                embed.addFields(
                        {
                            name: "\n",
                            value: `Usage: \n\n\`!sample (add/remove) (uma name)\``
                        }
                    )

                    await message.channel.send({ embeds: [embed], files: [file] })
                    return
            } else { // args length >= 2, check arg 1 for add/remove
                if (args[0].toLowerCase() == "add") {
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

                            if (getSamples['sample'].includes(charName)) {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `**${properName}** is already in your sample list`
                                    }
                                )

                                await message.channel.send({ embeds: [embed], files: [file] })
                                return
                            } else {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `Added **${properName}** to your sample list`
                                    }
                                )

                                await ids.updateOne({ discord_id: discordID },
                                    { $push: { sample: charName } },
                                    { upsert: true }
                                );

                                await message.channel.send({ embeds: [embed], files: [file] })
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
                } else if ((args[0].toLowerCase() == "remove") || (args[0].toLowerCase() == "delete")) {
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

                            if (getSamples['sample'].includes(charName)) {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `Removed **${properName}** from your sample list`
                                    }
                                )

                                await ids.updateOne({ discord_id: discordID },
                                    { $pull: { sample: charName } },
                                    { upsert: true }
                                );

                                await message.channel.send({ embeds: [embed], files: [file] })
                                return
                            } else {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `**${properName}** is not in your sample list`
                                    }
                                )

                                await message.channel.send({ embeds: [embed], files: [file] })
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

                        await message.channel.send({ embeds: [embed], files: [file] })
                    }
                } else {
                    embed.addFields(
                        {
                            name: "\n",
                            value: `Usage: \n\n\`!sample (add/remove) (uma name)\``
                        }
                    )

                    await message.channel.send({ embeds: [embed], files: [file] })
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