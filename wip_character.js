/*

const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const buttonPagination = require('../../button-pagination');
const path = require("path")

module.exports = {
    name: 'character',
    aliases: ['char'],
    description: 'Show character information',
    run: async ({ message }) => {
        try {
            var globalList = require('../../src/assets/global-list.json')
            var JPList = require('../../src/assets/jp-list.json')
            var bothLists = globalList.concat(JPList)

            const fetch = (await import("node-fetch")).default
            const res = await fetch(`https://umapyoi.net/api/v1/character/list`)
            var allData = await res.json()

            var charToSearch = message.content.slice(message.content.indexOf(' ') + 1).trim().toLowerCase().replace(/\s+/g, '')
            var existsInBot = null
            var existsInAll = null
            var arrayOfNames;
            var arrayOfImages;
            var id = -1

            for (let k = 0; k < bothLists.length; k++) { // First check if exists in the local json
                if (bothLists[k]["names"].includes(charToSearch)) {
                    existsInBot = true
                    arrayOfNames = bothLists[k]['names']
                    arrayOfImages = bothLists[k]['images']
                }
            }

            if (id == -1) { // If not found, check the data. By doing this second, we'll avoid a long search, since most people use nicknames to search anyways
                existsInAll = allData.find(a => a.name_en_internal === charToSearch)
                
                if (existsInAll != null) {
                    console.log(existsInAll)
                    id = existsInAll['id']
                }
            }

            console.log(existsInBot)
            console.log(existsInAll)

            // Only now, if the id is still -1 then it hasn't been found.
            // If id exists, then use existsInBot and existsInAll to customize error messages

            if ((existsInBot == null) && (existsInAll == null)) {
                await message.channel.send("**Unable to find character**")
                return
            } else { // Character found
                const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .addFields({ name: "\n", value: `\n` })

                const fetch = (await import("node-fetch")).default
                const res = await fetch(`https://umapyoi.net/api/v1/character/${id}`)
                const data = await res.json()

                embed.setThumbnail(data['thumb_img']);
                embed.setColor(data['color_main'])
                embed.setTitle(`**${data['name_en']}**`)
                embed.setDescription(`*"${data['profile']}"*`)

                embed.addFields(
                    {
                        name: `Description`,
                        value: data['slogan'] ?? 'N/A',
                        inline: true
                    },
                    {
                        name: `Nicknames`,
                        value: (arrayOfNames ?? []).join(', ') || 'N/A',
                        inline: true
                    },
                    {
                        name: `Profile`,
                        value: `Height: ${data['height'] ?? 'N/A'}cm\nWeight: ${data['weight'] ?? 'N/A'}\nMeasurements: B${data['size_b'] ?? 'N/A'} - H${data['size_h'] ?? 'N/A'} - W${data['size_w'] ?? 'N/A'}\nResidence: ${data['residence'] ?? 'N/A'}\nWeaknesses: ${data['weaknesses'] ?? 'N/A'}`,
                    },
                    {
                        name: `Facts`,
                        value: `Ears: ${data['ears_fact'] ?? 'N/A'}\nFamily: ${data['family_fact'] ?? 'N/A'}`,
                    },
                )

                if (existsInBot) { // load pics
                    var embeds = [];

                    for (let j = 0; j < arrayOfImages.length; j++) {
                        const fileName = arrayOfImages[j];
                        const imgPath = path.join(__dirname, `../assets/guessing/${fileName}`);

                        const pageEmbed = EmbedBuilder.from(embed).setImage(`attachment://${fileName}`) // create copy

                        embeds.push({
                            embed: pageEmbed,
                            file: imgPath
                        });
                    }

                    const sent = await message.channel.send({ content: "Loading character profile..." });
                    await buttonPagination(sent, embeds);
                } else { // else send message
                    await message.channel.send({ embeds: [embed] });
                }
  
            }
        } catch (err) {
            console.error(err);
            message.channel.send("Something went wrong while retrieving the character.");
        }
    }
};

*/