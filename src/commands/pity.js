var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('pity')
    .setDescription('Check your pity'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            await interaction.deferReply();

            // Placeholder embed for now
            var testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .addFields(
                {
                    name: "\n",
                    value: "\n"
                },
            )

            try {

                var client = new MongoClient(uri)

                var database = client.db("economy");
                var ids = database.collection("inventories")
                var discordID = parseInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                // If document found, get the hsr_id (set to 1, and id set to 0)
                if (counter >= 1) {

                    var options = {
                        projection: {
                            wish_count: 1,
                            four_star_pity: 1,
                            five_star_pity: 1
                        }
                    }

                    // Then get the first thing that matches the discord id, and options is the query from before
                    var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                    // Then find the thing called hsr_id
                    var wishCount = toParseUserUID['wish_count']
                    var fourStarPity = toParseUserUID['four_star_pity']
                    var fiveStarPity = toParseUserUID['five_star_pity']
                    
                    testEmbed.spliceFields(0, 1,
                        {
                            name: `\n`,
                            value: `Total Wishes: **${wishCount}**\n
5✦ Pity: **${fiveStarPity}**\n
4✦ Pity: **${fourStarPity}**`
                        })

                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()

                } else {
                    // If document not found, make a new database entry, do this for all economy commands

                    await setup.init(discordID, "economy", "inventories")
 
                    // Get the new value
                    var toParseUserUID = await ids.findOne({discord_id: discordID}, options);

                    var wishCount = toParseUserUID['wish_count']
                    var fourStarPity = toParseUserUID['four_star_pity']
                    var fiveStarPity = toParseUserUID['five_star_pity']

                    testEmbed.spliceFields(0, 1, {
                        name: "\n",
                        value: `Total Wishes: **${wishCount}**\n
                                4✦ Pity: **${fourStarPity}**\n
                                5✦ Pity: **${fiveStarPity}**`
                    })
                    
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