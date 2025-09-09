const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const buttonPagination = require('../../button-pagination');
const path = require("path")

var sources = require('../../src/assets/sources/sources.json')
var globalList = require('../../src/assets/global-list.json')
var JPList = require('../../src/assets/jp-list.json')
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
    name: 'character',
    aliases: ['char'],
    description: 'Show character information',

    data: new SlashCommandBuilder()
        .setName('character')
        .setDescription('Show character information')
        .addStringOption(option =>
            option.setName('character')
                .setDescription('Enter a character')
                .setRequired(true)
                .setAutocomplete(true)),

    async autocomplete (interaction) {
        const value = interaction.options.getFocused().toLowerCase();

        const filtered = choices.filter(choice => choice.toLowerCase().includes(value)).slice(0, 25);

        if (!interaction) return;

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    },

    run: async ({ interaction }) => {
        try {

            const sent = await interaction.deferReply()

            var charToSearch = interaction.options.getString('character')
            let found = false
            var id
            var charName
            var region

            const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .addFields({ name: "\n", value: `\n` })

            for (let i = 0; i < bothLists.length; i++) { // We are looping through both lists to find a matching uma that holds a *proper name* passed in through charToSearch
                if (bothLists[i]["proper"] == charToSearch) { // This will take a while :/
                    found = true
                    id = bothLists[i]["number"]
                    charName = bothLists[i]["id"]
                    properName = bothLists[i]["proper"]

                    if (id == 0) {
                        found = false
                        break
                    }

                    // Made it here, so the char was found. Locate in which list it was found in

                    for (let j = 0; j < globalList.length; j++) {
                        if (globalList[j]["number"] == id) {
                            region = "Global"
                            break
                        }
                    }

                    for (let h = 0; h < JPList.length; h++) {
                        if (JPList[h]["number"] == id) {
                            region = "Japan"
                            break
                        }
                    }

                    const fetch = (await import("node-fetch")).default
                    const res = await fetch(`https://umapyoi.net/api/v1/character/${id}`)
                    const data = await res.json()

                    embed.setThumbnail(data['thumb_img'] ?? 'https://i.imgur.com/sZgfUKW.png') // fallback on backup image
                    embed.setColor(data['color_main'] ?? 'LightGrey')
                    embed.setTitle(`**${properName ?? 'N/A'}**`) // grab from bothlists instead of api
                    embed.setDescription(`*"${data['profile'] ?? 'N/A'}"*`)

                    embed.addFields(
                        {
                            name: `Description`,
                            value: data['slogan'] ?? 'N/A',
                            inline: true
                        },
                        {
                            name: `Nicknames`,
                            value: bothLists[i]["names"].slice(1).join(', ') || 'N/A',
                            inline: true
                        },
                        {
                            name: `Profile`,
                            value: `Height: ${data['height'] ?? 'N/A'}cm\nWeight: ${data['weight'] ?? 'N/A'}\nMeasurements: B${data['size_b'] ?? 'N/A'} - H${data['size_h'] ?? 'N/A'} - W${data['size_w'] ?? 'N/A'}\nResidence: ${data['residence'] ?? 'N/A'}\nStrengths: ${data['strengths'] ?? 'N/A'}\nWeaknesses: ${data['weaknesses'] ?? 'N/A'}`,
                        },
                        {
                            name: `Facts`,
                            value: `Ears: ${data['ears_fact'] ?? 'N/A'}\nTail: ${data['tail_fact'] ?? 'N/A'}\nFamily: ${data['family_fact'] ?? 'N/A'}`,
                        },
                        {
                            name: `Region`,
                            value: `${region}`,
                        },
                    )

                    var embeds = [];

                    const arr = sources.find(item => item.id == charName)

                    for (let j = 0; j < bothLists[i]["images"].length; j++) { // Going through how many images there are
                        var artistName
                        var artistLink

                        const fileName = bothLists[i]["images"][j]
                        const imgPath = path.join(__dirname, `../assets/guessing/${fileName}`)

                        if (arr) {
                            artistName = arr.artworks[j]["artist"] ?? 'N/A'
                            artistLink = arr.artworks[j]["external_urls"][0] ?? 'N/A'
                        } else {
                            artistName = "Not found"
                            artistLink = "Not found"
                        }

                        const pageEmbed = EmbedBuilder.from(embed).setImage(`attachment://${fileName}`).setFooter({ text: `Artist: ${artistName}` }) // create copy

                        embeds.push({
                            embed: pageEmbed,
                            file: imgPath
                        });
                    }

                    await buttonPagination(sent, embeds);

                    break
                }
            }

            if (!found) {
                await interaction.editReply("**Unable to find character**")
                return
            }

        } catch (error) {
            const msg = error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Unable to send message: **${msg}**`);
                } else {
                    await interaction.reply({ content: `Unable to send message: **${msg}**`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
};