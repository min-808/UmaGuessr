const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { getMongoClient } = require('../connect-db.js')
const path = require("path")

const setup = require('../../firstinit');

const img = "favorite"

var globalList = require('../../src/assets/global-list.json')
var JPList = require('../../src/assets/jp-list.json')
var otherList = require('../../src/assets/other-list.json') // for norn, belno, and march info
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
    name: 'unfavorite',
    aliases: ['unfav'],
    description: 'Unfavorite one of the umas on your profile',

    data: new SlashCommandBuilder()
        .setName('unfavorite')
        .setDescription('Unfavorite one of the umas on your profile')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Enter an uma to remove from your list of favorites')
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

            const getFavs = await ids.findOne({ discord_id: discordID }, {
                projection: {
                    _id: 0,
                    favorites: 1,
                }
            })

            const embed = new EmbedBuilder()
                .setTitle(`Unfavorite an Uma`)
                .setColor('LightGrey')
                .addFields({ name: "\n", value: `\n` })

            if (interaction.options.getString('character') == null) {
                embed.addFields(
                    {
                        name: "\n",
                        value: `Type in the uma's name with the command to unfavorite it`
                    }
                )

                await interaction.editReply({ embeds: [embed] })
            } else {
                for (let i = 0; i < bothLists.length; i++) { // We are looping through both lists to find a matching uma that holds a nickname passed in through charToSearch
                    if (bothLists[i]["proper"] == charToSearch) { // This will take a while :/
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
                                    value: `Removed **${properName}** from your list of favorite umas`
                                }
                            )

                            await ids.updateOne({ discord_id: discordID },
                                { $pull: { favorites: charName } },
                                { upsert: true }
                            );

                            await interaction.editReply({ embeds: [embed] })
                            return
                        } else {
                            embed.addFields(
                                {
                                    name: "\n",
                                    value: `**${properName}** is not in your list of favorite umas`
                                }
                            )

                            await interaction.editReply({ embeds: [embed] })
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