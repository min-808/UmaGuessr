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

            var charToSearch = message.content.slice(message.content.indexOf(' ') + 1).trim().toLowerCase().replace(/\s+/g, '')
            let found = false

            const embed = new EmbedBuilder()
                .setColor('LightGrey')
                .addFields({ name: "\n", value: `\n` })

            for (let i = 0; i < bothLists.length; i++) {
                if (bothLists[i]["names"].includes(charToSearch)) { // This will take a while :/
                    found = true
                    var id = bothLists[i]["number"]

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
                            value: `${data['slogan']}`,
                            inline: true
                        },
                        {
                            name: `Nicknames`,
                            value: bothLists[i]["names"].join(', '),
                            inline: true
                        },
                        {
                            name: `Profile`,
                            value: `Height: ${data['height']}cm\nWeight: ${data['weight']}\nResidence: ${data['residence']}\nWeaknesses: ${data['weaknesses']}`,
                        },
                        {
                            name: `Facts`,
                            value: `Ears: ${data['ears_fact']}\nFamily: ${data['family_fact']}`,
                        },
                    )

                    /*
                    var embeds = []

                    for (let j = 0; j < bothLists[i]["images"].length; j++) {
                        const fileName = bothLists[i]["images"][j]
                        const imgPath = path.join(__dirname, `../assets/guessing/${fileName}`)

                        const imageEmbed = new EmbedBuilder()
                        const attachment = new AttachmentBuilder(imgPath).setName(fileName)
                        imageEmbed.setImage(`attachment://${fileName}`)
                        embeds.push(imageEmbed)
                    }

                    await buttonPagination(sent, embeds);
                    */
                    break
                }
            }

            if (!found) {
                embed.spliceFields(0, 1, {
                    name: "**Unable to find character**",
                    value: `\n`
                });
            }

            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error(err);
            message.channel.send("Something went wrong while retrieving the character.");
        }
    }
};
