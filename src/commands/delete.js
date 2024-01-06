var { SlashCommandBuilder, EmbedBuilder, ButtonStyle, ButtonBuilder, ActionRowBuilder, ComponentType } = require('discord.js');
var { MongoClient } = require("mongodb");

const setup = require('../../firstinit');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete your account'),

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
                        _id: 1
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                var getID = toParseUserUID['_id']

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
                        value: `Are you sure you want to delete your account?\n\nThis action is **irreversible**!`
                    })

                const reply = await interaction.editReply({ embeds: [testEmbed], components: [buttonRow] });

                const collector = reply.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    filter: (i) =>
                    i.user.id === interaction.user.id && i.channelId === interaction.channelId, // Only the person who did the command can interact
                    time: 20_000
                })

                collector.on('collect', async (interaction) => {
                    if (interaction.customId === 'yes') {

                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `Type \`CONFIRM\` to delete account`
                            })
                        
                        interaction.reply({ embeds: [testEmbed] });
                            
                        const collectorConfirm = interaction.channel.createMessageCollector({
                            filter: (message) =>
                                message.author.id === interaction.user.id && message.channelId === interaction.channelId, // only the user who sent the command
                                time: 20_000
                        })
            
                        collectorConfirm.on('collect', async (message) => {
                            testEmbed.spliceFields(0, 1,
                                {
                                    name: "\n",
                                    value: `No action was taken`
                                })

                            if (message.content == `CONFIRM`) {
                                await ids.deleteOne({ _id: getID })

                                testEmbed.spliceFields(0, 1,
                                    {
                                        name: "\n",
                                        value: `Deleted account`
                                    })
                                collectorConfirm.stop()
                            } else {
                                collectorConfirm.stop()
                            }
                        })
                        
                        collectorConfirm.on('end', () => {
                            interaction.channel.send({ embeds: [testEmbed] })
                        })
                            
                    }

                    if (interaction.customId === 'no') {
                        testEmbed.spliceFields(0, 1,
                            {
                                name: "\n",
                                value: `No action was taken`
                            })
                        
                        interaction.reply({ embeds: [testEmbed] });
                        await client.close()

                        collector.stop()
                    }
                })

                collector.on('end', async () => {
                    yesButton.setDisabled(true)
                    noButton.setDisabled(true)

                    reply.edit({
                        components: [buttonRow]
                    })
                }) 

                } catch (error) {
                    console.log(`There was an error: ${error}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
                }
        })();
    }
}