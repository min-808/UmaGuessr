var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');
const buttonPagination = require('../../button-pagination')

const charSheet = require('../../src/assets/characters.json')
const LCSheet = require('../../src/assets/light_cones.json')
const emoteSheet = require('../../src/assets/emotes.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('collection')
    .setDescription('Check your character collection'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            try {

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("inventories")
                var discordID = parseInt(interaction.user.id)

                var counter = await ids.countDocuments({discord_id: discordID})

                if (counter >= 1) { // If you have an account with the bot AND you have at least one character

                    var options = {
                        projection: {
                            characters: 1,
                        }
                    }
    
                    var listOfCharacters = (await ids.findOne({discord_id: discordID}, options))['characters']
    
                    // console.log(listOfItems)
                    var size = Object.keys(listOfCharacters).length
    
                    // console.log(size)

                    var showPerPage = 5

                    if (size > 0) {
                
                        var pages = Math.floor(size / showPerPage)
                        if (size % showPerPage != 0) { // In case of uneven pages
                            pages += 1;
                        }

                        const embeds = []
                        for (let i = 0; i < pages; i++) {
                            embeds.push(new EmbedBuilder().setDescription(`**Characters | Page (${i + 1}/${pages})**`)
                            .setColor(0x9a7ee7)
                            .addFields(
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" },
                                { name: "\n", value: "\n" }
                            )
                            )

                            if (size >= showPerPage) { // fill the page!
                                
                                for (var j = 0; j < showPerPage; j++) {
                                    currentCharacter = Object.keys(listOfCharacters)[Object.keys(listOfCharacters).length - 1] // Set the current character to the last one

                                    embeds[i].spliceFields(j, j + 1,
                                        {
                                            name: `**${charSheet[currentCharacter]["name"]}** (${charSheet[currentCharacter]["rarity"]}${emoteSheet["Stars"]["StarBig"]["id"]})`, value: `Light Cone: **${LCSheet[listOfCharacters[currentCharacter]["lc"]]["name"]}**\nLevel: ${listOfCharacters[currentCharacter]["level"]}\nEidolon: ${listOfCharacters[currentCharacter]["eidolon"]}`
                                        }
                                    )
                                    delete listOfCharacters[`${currentCharacter}`] // Remove the first character from your list
                                }
                                size -= showPerPage // Decrement
                            } else if (size < showPerPage) { // only fill as much as you need (size)
                                for (var h = 0; h < size; h++) {
                                    currentCharacter = Object.keys(listOfCharacters)[Object.keys(listOfCharacters).length - 1]

                                    embeds[i].spliceFields(h, h + 1,
                                        {
                                            name: `**${charSheet[currentCharacter]["name"]}** (${charSheet[currentCharacter]["rarity"]}${emoteSheet["Stars"]["StarBig"]["id"]})`, value: `Light Cone: **${LCSheet[listOfCharacters[currentCharacter]["lc"]]["name"]}**\nLevel: ${listOfCharacters[currentCharacter]["level"]}\nEidolon: ${listOfCharacters[currentCharacter]["eidolon"]}`
                                        }
                                    )
                                    delete listOfCharacters[`${currentCharacter}`]
                                }
                                size = 0
                            }
                        }
                        await buttonPagination(interaction, embeds)
                        await client.close()
                    } else if (size == 0) { // You have an account but you didn't wish yet; 0 characters (won't happen but in case)
                        var testEmbed = new EmbedBuilder()
                        .setDescription(`**Characters | Page (1/1)**`)
                        .setColor(0x9a7ee7)
                        .addFields(
                            { name: "You have no characters!", value: "\n" }
                        )
                        
                        await interaction.deferReply()
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                        }
                } else if (counter == 0) { // You don't have an account yet, this assumes you have only Trailblazer, March 7th, and Dan Heng
                    
                    await setup.init(discordID, "economy", "inventories")

                    var testEmbed = new EmbedBuilder()
                        .setDescription(`**Characters | Page (1/1)**`)
                        .setColor(0x9a7ee7)
                        .addFields(
                            { name: `Trailblazer (5${emoteSheet["Stars"]["StarBig"]["id"]})`, value: "\n" },
                            { name: `March 7th (4${emoteSheet["Stars"]["StarBig"]["id"]})`, value: "\n" },
                            { name: `Dan Heng (4${emoteSheet["Stars"]["StarBig"]["id"]})`, value: "\n" }
                        )
                    
                    await interaction.deferReply()
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } 
            } catch (error) {
                console.log(`There was an error: ${error}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }

        })();
    }
}