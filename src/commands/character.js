const { EmbedBuilder } = require('discord.js');
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

            var charToSearch = message.content.slice(message.content.indexOf(' ') + 1).trim().toLowerCase().replace(/\s+/g, '')
            let found = false

            const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .addFields({ name: "\n", value: `\n` })

            for (let i = 0; i < bothLists.length; i++) {
                if (bothLists[i]["names"].includes(charToSearch)) { // This will take a while :/
                    found = true
                    var id = bothLists[i]["number"]

                    if (id == 0) {
                        found = false
                        break
                    }

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
                            value: bothLists[i]["names"].join(', ') ?? 'N/A',
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

                    var embeds = [];

                    for (let j = 0; j < bothLists[i]["images"].length; j++) {
                        const fileName = bothLists[i]["images"][j];
                        const imgPath = path.join(__dirname, `../assets/guessing/${fileName}`);

                        const pageEmbed = EmbedBuilder.from(embed).setImage(`attachment://${fileName}`) // create copy

                        embeds.push({
                            embed: pageEmbed,
                            file: imgPath
                        });
                    }

                    const sent = await message.channel.send({ content: "Loading character profile..." });
                    await buttonPagination(sent, embeds);

                    break
                }
            }

            if (!found) {
                await message.channel.send("**Unable to find character**")
                return
            }

        } catch (err) {
            console.error(err);
            message.channel.send("Something went wrong while retrieving the character.");
        }
    }
};