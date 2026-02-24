const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js')
const { getMongoClient } = require('../connect-db.js')

const setup = require('../../firstinit.js');

const img = "practice"

var globalList = require('../assets/global-list.json')
var JPList = require('../assets/jp-list.json')
var bothLists = globalList.concat(JPList)

bothLists.sort((a, b) => a.proper.localeCompare(b.proper));

let newChoices = []
let filteredChoices = []

var count = bothLists.length

for (var i = 0; i < count; i++) {
    newChoices.push(bothLists[i]["proper"])
}

filteredChoices = newChoices.filter(function(item, pos) {
    return newChoices.indexOf(item) == pos
})

var choices = filteredChoices

module.exports = {
    name: 'practice',
    aliases: ['practice', 'prac'],
    description: 'Add umas to your practice list',

    data: new SlashCommandBuilder()
        .setName('practice')
        .setDescription('Add umas to your practice list')
        .addStringOption(option =>
            option.setName('option')
                .setDescription('Choose to add or remove an uma from your practice list')
                .setRequired(false)
                .addChoices(
                    { name: 'Add', value: 'add' },
                    { name: 'Remove', value: 'remove' })
                )
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Enter an uma to add to your practice list')
                .setRequired(false)
                .setAutocomplete(true)),

    async autocomplete (interaction) {
        const value = interaction.options.getFocused().toLowerCase();

        const filtered = choices.filter(choice => choice.toLowerCase().includes(value)).slice(0, 25);

        if (!interaction) return;

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },
    
    run: async ({ interaction, client }) => {
        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

        const user = interaction.user

        try {
            await interaction.deferReply()

            var client_db = new getMongoClient();
            const database = client_db.db("uma");
            const ids = database.collection("profiles");
            var discordID = BigInt(user.id);

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            var charToSearch = interaction.options.getString('character')
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
                .setTitle(`Add Practice Umas`)
                .setColor('LightGrey')
                .setThumbnail(`attachment://${img}.png`)

            if ((interaction.options.getString('option') == null) && (interaction.options.getString('character') == null)) {
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

                await interaction.editReply({ embeds: [embed], files: [file] })
            } else if ((interaction.options.getString('option') == null) || (interaction.options.getString('character') == null)) {
                embed.addFields(
                        {
                            name: "\n",
                            value: `Usage: \n\n\`/practice (Add/Remove) (uma name)\``
                        }
                    )

                    await interaction.editReply({ embeds: [embed], files: [file] })
                    return
            } else { // args length >= 2, check arg 1 for add/remove
                if (interaction.options.getString('option') == "add") {
                    for (let i = 0; i < bothLists.length; i++) { // We are looping through both lists to find a matching uma that holds a nickname passed in through charToSearch
                        if (bothLists[i]["proper"].includes(charToSearch)) { // This will take a while :/
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
                                        value: `**${properName}** is already in your practice list`
                                    }
                                )

                                await interaction.editReply({ embeds: [embed], files: [file] })
                                return
                            } else {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `Added **${properName}** to your practice list`
                                    }
                                )

                                await ids.updateOne({ discord_id: discordID },
                                    { $push: { sample: charName } },
                                    { upsert: true }
                                );

                                await interaction.editReply({ embeds: [embed], files: [file] })
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

                        await interaction.editReply({ embeds: [embed] })
                    }
                } else if (interaction.options.getString('option') == "remove") {
                    for (let i = 0; i < bothLists.length; i++) { // We are looping through both lists to find a matching uma that holds a nickname passed in through charToSearch
                        if (bothLists[i]["proper"].includes(charToSearch)) { // This will take a while :/
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
                                        value: `Removed **${properName}** from your practice list`
                                    }
                                )

                                await ids.updateOne({ discord_id: discordID },
                                    { $pull: { sample: charName } },
                                    { upsert: true }
                                );

                                await interaction.editReply({ embeds: [embed], files: [file] })
                                return
                            } else {
                                embed.addFields(
                                    {
                                        name: "\n",
                                        value: `**${properName}** is not in your practice list`
                                    }
                                )

                                await interaction.editReply({ embeds: [embed], files: [file] })
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

                        await interaction.editReply({ embeds: [embed], files: [file] })
                    }
                } else {
                    embed.addFields(
                        {
                            name: "\n",
                            value: `Usage: \n\n\`/practice (Add/Remove) (uma name)\``
                        }
                    )

                    await interaction.editReply({ embeds: [embed], files: [file] })
                }
                
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