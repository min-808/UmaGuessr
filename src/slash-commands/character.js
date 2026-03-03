const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const buttonPagination = require('../../pagination-button');
const path = require("path")
const { getMongoClient } = require('../connect-db.js');

var sources = require('../../src/assets/sources/sources.json')
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

                    var data

                    var client_db = new getMongoClient()
                    var database = client_db.db("uma");
                    var ids = database.collection("count")

                    const umaStats = await ids.find({}, {
                        projection: {
                            name: 1,
                            count: 1,
                            wins: 1,
                            old_count: 1,
                        }
                    }).toArray()

                    umaStats.sort((a, b) => {
                        const aRate = a.count ? a.wins / a.count : 0
                        const bRate = b.count ? b.wins / b.count : 0
                        return bRate - aRate
                    });

                    let umaWins = (umaStats.find(c => c.name == charName)["wins"])
                    let umaCount = (umaStats.find(c => c.name == charName)["count"])
                    let umaOldCount = (umaStats.find(c => c.name == charName)["old_count"])

                    let umaRank = umaStats.findIndex(c => c.name == charName) + 1
                    let umaTotalCount = umaStats.length - 1 // cuz of cookiezi lmao

                    const fetch = (await import("node-fetch")).default
                    const res = await fetch(`https://umapyoi.net/api/v1/character/${id}`)

                    if (!res.ok) {
                        data = otherList.find(item => item.id === id) // check other list

                        if (!data) { // if 404 return bad
                            console.error(`API returned ${res.status}: ${res.statusText}`);
                            return message.channel.send(`**Error fetching character data**`);
                        }
                    } else {
                        data = await res.json()
                    }

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
                            value: `Height: ${data['height'] ?? '?'}cm\nWeight: ${data['weight'] ?? '?'}\nMeasurements: B${data['size_b'] ?? '?'} - H${data['size_h'] ?? '?'} - W${data['size_w'] ?? '?'}\nResidence: ${data['residence'] ?? 'N/A'}\nStrengths: ${data['strengths'] ?? 'N/A'}\nWeaknesses: ${data['weaknesses'] ?? 'N/A'}\nBirthday: ${data['birth_month'] ?? '?'}/${data['birth_day'] ?? '?'}`,
                        },
                        {
                            name: `Facts`,
                            value: `Ears: ${data['ears_fact'] ?? 'N/A'}\nTail: ${data['tail_fact'] ?? 'N/A'}\nFamily: ${data['family_fact'] ?? 'N/A'}`,
                        },
                        {
                            name: `Winrate // Times Shown`,
                            value: `${+((umaWins / umaCount) * 100).toFixed(2) || 0}% // ${umaOldCount}`,
                        },
                        {
                            name: `Rank`,
                            value: `${umaRank}/${umaTotalCount}`,
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
                            artistName = arr.artworks[j]["artist"] ?? 'n/a'
                            artistLink = arr.artworks[j]["external_urls"][0] ?? 'n/a'
                        } else {
                            artistName = "Not found"
                            artistLink = "Not found"
                        }

                        const pageEmbed = EmbedBuilder.from(embed).setImage(`attachment://${fileName}`).setFooter({ text: `Artist: ${artistName} // (#${j + 1})` }) // create copy

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
};