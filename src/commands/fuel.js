var { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('fuel')
    .setDescription('Turn your fuel into trailblaze power (1 fuel -> 60 power)')
    .addIntegerOption((option) =>
        option
            .setName("amount")
            .setDescription("Enter the amount of fuel you want to use (1 fuel -> 60 power)")
            .setRequired(true)
            
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
                        fuel: 1,
                        trailblaze_power: 1,
                        max_trailblaze_power: 1
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var fuelAmount = toParseUserUID['fuel']
                var powerAmount = toParseUserUID['trailblaze_power']
                var maxPowerAmount = toParseUserUID['max_trailblaze_power']

                if (interaction.options.get('amount') == undefined) { // Nothing was entered
                    testEmbed.spliceFields(0, 1,
                        {
                            name: "\n",
                            value: `Enter an amount`
                        })
                    
                    interaction.editReply({ embeds: [testEmbed] });
                    await client.close()
                } else { // Something was entered
                    var amountEntered = interaction.options.get('amount').value
                    
                    if (amountEntered > fuelAmount) { // You don't have enough
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `You don't have enough fuel to use. You entered **${amountEntered}** but you have **${fuelAmount}** fuel`
                            })
                        
                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()
                    } else { // You have enough hooray
                        var convert = amountEntered * 60

                        if (powerAmount + convert >= maxPowerAmount) { // You're going to go over the cap, give a warning with check box and no box
                            const yesButton = new ButtonBuilder()
                                .setLabel('✓')
                                .setStyle(ButtonStyle.Primary)
                                .setCustomId('yes')

                            const noButton = new ButtonBuilder()
                                .setLabel('✗')
                                .setStyle(ButtonStyle.Danger)
                                .setCustomId('no')

                            const buttonRow = new ActionRowBuilder().addComponents(yesButton, noButton)

                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `You have **${powerAmount}** power and by using **${amountEntered}** fuel, you will be over the cap with **${powerAmount + convert}** power\n\nDo you want to proceed?`
                                })

                            const reply = await interaction.editReply({ embeds: [testEmbed], components: [buttonRow] })

                            const collector = reply.createMessageComponentCollector({
                                componentType: ComponentType.Button,
                                filter: (i) =>
                                i.user.id === interaction.user.id && i.channelId === interaction.channelId, // Only the person who did the command can interact
                                time: 20_000
                            })

                            collector.on('collect', async (interaction) => {
                                if (interaction.customId === 'yes') {
                                    const toUpdate = {
                                        $inc: {
                                            trailblaze_power: convert,
                                            fuel: -amountEntered
                                        }
                                    }
        
                                    await ids.updateOne({discord_id: discordID}, toUpdate)
        
                                    var updatedValues = await ids.findOne({discord_id: discordID}, options)
        
                                    var newFuel = updatedValues['fuel']
                                    var newPower = updatedValues['trailblaze_power']
        
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `Used **${amountEntered}** fuel\n\nYou now have **${newFuel}** fuel and **${newPower}** power`
                                        })
                                    
                                    interaction.reply({ embeds: [testEmbed] });
                                    await client.close()
                                }

                                if (interaction.customId === 'no') {
                                    testEmbed.spliceFields(0, 1,
                                        {
                                            name: "\n",
                                            value: `Your fuel has been returned`
                                        })
                                    
                                    interaction.reply({ embeds: [testEmbed] });
                                    await client.close()
                                }
                            })

                            collector.on('end', async () => {
                                yesButton.setDisabled(true)
                                noButton.setDisabled(true)

                                reply.edit({
                                    components: [buttonRow]
                                })
                                await client.close()
                            }) 

                        } else { // Give the power
                            const toUpdate = {
                                $inc: {
                                    trailblaze_power: convert,
                                    fuel: -amountEntered
                                }
                            }

                            await ids.updateOne({discord_id: discordID}, toUpdate)

                            var updatedValues = await ids.findOne({discord_id: discordID}, options)

                            var newFuel = updatedValues['fuel']
                            var newPower = updatedValues['trailblaze_power']

                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `Used **${amountEntered}** fuel\n\nYou now have **${newFuel}** fuel and **${newPower}** power`
                                })
                            
                            interaction.editReply({ embeds: [testEmbed] });
                            await client.close()
                        }
                }
                }   
            } catch (error) {
                console.log(`There was an error: ${error}`)
                interaction.editReply({ content: "Something broke!"})
                await client.close()
            }
        })();
    }
}