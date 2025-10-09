const { EmbedBuilder } = require('discord.js');
const buttonPagination = require('../../button-pagination');
const path = require("path")
const { MongoClient } = require("mongodb")

module.exports = {
    name: 'character',
    aliases: ['char'],
    description: 'Show character information',
    run: async ({ message }) => {
        try {
            var sources = require('../../src/assets/sources/sources.json')

            var globalList = require('../../src/assets/global-list.json')
            var JPList = require('../../src/assets/jp-list.json')
            var otherList = require('../../src/assets/other-list.json') // for norn, belno, and march info
            var bothLists = globalList.concat(JPList)

            var charToSearch = message.content.slice(message.content.indexOf(' ') + 1).trim().toLowerCase().replace(/\s+/g, '')
            let found = false
            var id
            var charName
            var region

            const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .addFields({ name: "\n", value: `\n` })

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

                    var client_db = new MongoClient(process.env.MONGODB_URI)
                    var database = client_db.db("uma");
                    var ids = database.collection("count")

                    const umaStats = await ids.findOne({ name: charName }, {
                        projection: {
                            count: 1,
                            wins: 1,
                            old_count: 1,
                        }
                    })

                    if ((id === 50000) || (id === 50001) || (id === 50002)) {
                        data = otherList.find(item => item.id === id)
                    } else {
                        const fetch = (await import("node-fetch")).default
                        const res = await fetch(`https://umapyoi.net/api/v1/character/${id}`)
                        if (!res.ok) {
                                console.error(`API returned ${res.status}: ${res.statusText}`);
                                return message.channel.send(`Error fetching character data`);
                        }
                        
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
                            value: `Height: ${data['height'] ?? 'N/A'}cm\nWeight: ${data['weight'] ?? 'N/A'}\nMeasurements: B${data['size_b'] ?? 'N/A'} - H${data['size_h'] ?? 'N/A'} - W${data['size_w'] ?? 'N/A'}\nResidence: ${data['residence'] ?? 'N/A'}\nStrengths: ${data['strengths'] ?? 'N/A'}\nWeaknesses: ${data['weaknesses'] ?? 'N/A'}`,
                        },
                        {
                            name: `Facts`,
                            value: `Ears: ${data['ears_fact'] ?? 'N/A'}\nTail: ${data['tail_fact'] ?? 'N/A'}\nFamily: ${data['family_fact'] ?? 'N/A'}`,
                        },
                        {
                            name: `Winrate // Times Shown`,
                            value: `${(umaStats["wins"] / umaStats["count"] * 100).toFixed(2)}% // ${umaStats["old_count"]}`,
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
                            artistName = arr.artworks[j]["artist"] ?? 'Support Card'
                            artistLink = arr.artworks[j]["external_urls"][0] ?? 'N/A'
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

                    const sent = await message.channel.send({ content: "Loading character profile..." });
                    await buttonPagination(sent, embeds);
                    await client_db.close()
                    break
                }
            }

            if (!found) {
                await message.channel.send("**Unable to find character**")
                return
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
};