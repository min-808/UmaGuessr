var { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Purchase exp material with credits')
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("Enter the amount of exp material you want to buy (250 credits => 1 material)")
            .setRequired(false)
            
    ),

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
                var discordID = BigInt(interaction.user.id)

                // Check how many documents are in the query (discord_id)
                var counter = await ids.countDocuments({discord_id: discordID})

                if (counter < 1) {
                    // If document not found, make a new database entry, do this for all economy commands
                    await setup.init(discordID, "economy", "inventories")
                }
                var options = {
                    projection: {
                        credits: 1,
                        exp_material: 1
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var credits = toParseUserUID['credits']
                var exp_material = toParseUserUID['exp_material']

                if (interaction.options.get('amount') == undefined) { // If nothing was entered
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Enter an amount`
                        })
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else { // Something was entered
                    var amountEntered = interaction.options.get('amount').value
                    var cost = (amountEntered * 250)
                    if (cost > credits) { // can't afford
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `You don't have enough credits to buy **${amountEntered}** EXP Material\nYou need **${cost}** credits but you only have **${credits}** credits`
                            })
                        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else { // can afford

                        const toUpdate = {
                            $inc: {
                                exp_material: amountEntered,
                                credits: -cost
                            }
                        }

                        await ids.updateOne({discord_id: discordID}, toUpdate)

                        var updatedAmount = await ids.findOne({discord_id: discordID}, options);
                        var updatedCredits = updatedAmount['credits']
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `Successfully bought **${amountEntered}** EXP Material\nYou now have **${updatedCredits}** credits`
                            })
                        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    }
                }

                } catch (error) {
                    console.log(`There was an error: ${error.stack}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
                }
        })();
    }
}