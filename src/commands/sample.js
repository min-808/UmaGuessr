const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
const { getMongoClient } = require('../connect-db.js')

const setup = require('../../firstinit.js');

const img = "practice"

module.exports = {
    name: 'practice',
    aliases: ['sample', 'samples', 'samp', 'practice', 'prac'],
    description: 'Add umas to your practice list',
    
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
            
            var globalList = require('../assets/global-list.json')
            var JPList = require('../assets/jp-list.json')
            var bothLists = globalList.concat(JPList)

            var charToSearch
            var id
            var charName

            const getSamples = await ids.findOne({ discord_id: discordID }, {
                projection: {
                    _id: 0,
                    sample: 1,
                }
            })

            const embed = new EmbedBuilder()
                .setTitle(`Add Practice Umas`)
                .setColor('LightGrey')
                .setThumbnail(`attachment://${img}.png`)

            const addFieldIfAny = (name, arr) => { // embed helper function
                if (!arr?.length) return;
                embed.addFields({
                    name,
                    value: arr
                        .map(item => (bothLists.find(e => e.id === item)?.proper ?? item))
                        .join("\n")
                        .slice(0, 1024), // field char limit
                })
            }

            if (args.length == 0) {
                if (getSamples['sample'].length == 0) {
                    embed.addFields(
                        {
                            name: "\n",
                            value: `You have no umas in your practice list.\n\nTo add, do \`!practice add (uma name)\`\nTo remove, do \`!practice remove (uma name)\``
                        }
                    )
                } else {
                    embed.addFields(
                        {
                            name: "\n",
                            value: `Your current practice list: \n\n**${getSamples['sample'].map(item => bothLists.find(entry => entry.id == item)['proper']).join('\n')}**`
                        }
                    )
                }

                await message.channel.send({ embeds: [embed], files: [file] })
            } else if (args.length == 1) {
                embed.addFields(
                        {
                            name: "\n",
                            value: `Usage: \n\n\`!practice (add/remove) (uma name)\``
                        }
                    )

                    await message.channel.send({ embeds: [embed], files: [file] })
                    return
            } else { // args length >= 2, check arg 1 for add/remove
                let errChars = []
                let addRemChars = []
                let dupeChars = []

                let raw = args.slice(1).join(" ")
                let sampArgs = [...new Set(
                    raw.split(",")
                        .map(s => s.trim().toLowerCase().replace(/\s+/g, ""))
                        .filter(Boolean)
                )];

                if (args[0].toLowerCase() == "add") { // for every uma in the args, add to sample list
                    for (let j = 0; j < sampArgs.length; j++) {
                        let found = false

                        for (let i = 0; i < bothLists.length; i++) { // We are looping through both lists to find a matching uma that holds a nickname passed in through charToSearch
                            if (bothLists[i]["names"].includes(sampArgs[j])) { // This will take a while :/
                                found = true

                                id = bothLists[i]["number"]
                                charName = bothLists[i]["id"]
                                properName = bothLists[i]["proper"]

                                if (getSamples['sample'].includes(charName)) {
                                    dupeChars.push(charName)
                                } else {
                                    addRemChars.push(charName)
                                }

                                break
                            }
                        }

                        if (found == false) {
                            errChars.push(sampArgs[j])
                        }
                    }

                    addFieldIfAny("Added", addRemChars);
                    addFieldIfAny("Already in list", dupeChars);
                    addFieldIfAny("Not found", errChars);

                    if (embed.data.fields?.length) {
                        await message.channel.send({ embeds: [embed], files: [file] });
                    } else {
                        await message.channel.send("No changes, nothing to add/remove");
                    }

                    await ids.updateOne({ discord_id: discordID },
                        { $push: { sample: { $each: addRemChars } } },
                        { upsert: true }
                    );
                } else if ((args[0].toLowerCase() == "remove") || (args[0].toLowerCase() == "delete")) {
                    for (let j = 0; j < sampArgs.length; j++) {
                        let found = false

                        for (let i = 0; i < bothLists.length; i++) { // We are looping through both lists to find a matching uma that holds a nickname passed in through charToSearch
                            if (bothLists[i]["names"].includes(sampArgs[j])) { // This will take a while :/
                                found = true

                                id = bothLists[i]["number"]
                                charName = bothLists[i]["id"]
                                properName = bothLists[i]["proper"]

                                if (getSamples['sample'].includes(charName)) {
                                    addRemChars.push(charName) // to remove
                                } else {
                                    dupeChars.push(charName) // this will hold umas aren't in the list but were in args
                                }

                                break
                            }
                        }

                        if (found == false) {
                            errChars.push(sampArgs[j])
                        }
                    }

                    addFieldIfAny("Removed", addRemChars);
                    addFieldIfAny("Currently not in list", dupeChars);
                    addFieldIfAny("Not found", errChars);

                    if (embed.data.fields?.length) {
                        await message.channel.send({ embeds: [embed], files: [file] });
                    } else {
                        await message.channel.send("No changes, nothing to add/remove");
                    }

                    await ids.updateOne({ discord_id: discordID },
                        { $pull: { sample: { $in: addRemChars } } },
                        { upsert: true }
                    );
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