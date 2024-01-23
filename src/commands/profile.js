var { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
var { MongoClient } = require("mongodb");

const charSheet = require('../../src/assets/characters.json')
const LCSheet = require('../../src/assets/light_cones.json')
const TLSheet = require('../../src/assets/tl.json')
const areaSheet = require('../../src/assets/areas.json')

const setup = require('../../firstinit');
const checkLevel = require('../../check-level');

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Shows your bot game stats'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            await interaction.deferReply();

            const file = new AttachmentBuilder('src/assets/peppy.png');

            // Placeholder embed for now
            var testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .setThumbnail("attachment://peppy.png")
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
                        jade_count: 1,
                        credits: 1,
                        exp_material: 1,
                        trailblaze_power: 1,
                        fuel: 1,
                        level: 1,
                        exp: 1,
                        rewards: 1,
                        characters: 1,
                        inventory: 1,
                        missions: 1,
                        missions_completed: 1,
                        assignment_level: 1,
                        trailblaze_power_used_today: 1,
                    }
                }

                // Then get the first thing that matches the discord id, and options is the query from before
                var levelSuccess = await checkLevel.checker(discordID, "economy", "inventories")
                var finalCheck = await ids.findOne({discord_id: discordID}, options)

                var jade_count = finalCheck['jade_count']
                var credits = finalCheck['credits']
                var exp_material = finalCheck['exp_material']
                var trailblaze_power = finalCheck['trailblaze_power']
                var fuel = finalCheck['fuel']
                var level = finalCheck['level']
                var exp = finalCheck['exp']
                var characters = finalCheck['characters']
                var inventory = finalCheck['inventory']
                var assignmentLevel = finalCheck['assignment_level']
                var currentRewardLevel = finalCheck['rewards']
                var TPUsedToday = finalCheck['trailblaze_power_used_today']

                var amountOf5 = 0
                var amountOf4 = 0
                var amountOf3 = 0

                for (var i = 0; i < Object.keys(characters).length; i++) {
                    if (charSheet[Object.keys(characters)[i]]['rarity'] == 5) {
                        amountOf5++;
                    } else if (charSheet[Object.keys(characters)[i]]['rarity'] == 4) {
                        amountOf4++;
                    } else {
                        amountOf3++
                    }
                }

                for (var i = 0; i < Object.keys(inventory).length; i++) {
                    if (LCSheet[Object.keys(inventory)[i]]['rarity'] == 5) {
                        amountOf5++
                    } else if (LCSheet[Object.keys(inventory)[i]]['rarity'] == 4) {
                        amountOf4++
                    } else {
                        amountOf3++
                    }
                }
                
                testEmbed.spliceFields(0, 1,
                    {
                        name: "\n",
                        value: `**Profile**`
                    })

                testEmbed.addFields({
                    name: "\n",
                    value: `Trailblaze Level **${level}**
EXP to Next Level **${exp}**/${TLSheet[level]["next_exp"]}\n
**${amountOf5}** Five Stars
**${amountOf4}** Four Stars
**${amountOf3}** Three Stars\n
Highest Planet: **${areaSheet[assignmentLevel]['name']}**
Power Used Today: **${TPUsedToday}**\n`,
                    inline: true
                })

                testEmbed.addFields({
                    name: "\n",
                    value: `**${jade_count}** Stellar Jade\n**${credits}** Credits\n**${exp_material}** EXP Material\n\n**${trailblaze_power}**/240 Trailblaze Power\n**${fuel}** Fuel`,
                    inline: true
                })

                var getMissions = finalCheck['missions']

                var addMissionID = []

                for (var i = 0; i < 5; i++) {
                    addMissionID.push(getMissions[i]["id"])
                }

                if ((addMissionID.includes(6)) && (getMissions[addMissionID.indexOf(6)]["completed"] == false)) { // id for profile mission
                    var mission = `missions.${addMissionID.indexOf(6)}.completed`
                    var missionSymbol = `missions.${addMissionID.indexOf(6)}.completed_symbol`

                    const setTrue = {
                        $set: {
                            [mission]: true,
                            [missionSymbol]: "✅",
                        },
                        $inc: {
                            jade_count: 75,
                            exp: 290,
                        }
                    }

                    await ids.updateOne({discord_id: discordID}, setTrue)
                }

                if (currentRewardLevel < level) {
                    testEmbed.setFooter({text: "You can claim Trailblaze Level rewards with /rewards"})
                }

                interaction.editReply({ embeds: [testEmbed], files: [file] });

                if (levelSuccess) {
                    var levelEmbed = new EmbedBuilder()
                    .setColor(0x9a7ee7)
                    .addFields(
                        {
                            name: "\n",
                            value: "You leveled up!"
                        },
                    )
                    await interaction.channel.send({ embeds: [levelEmbed] })
                }

                await client.close()

                } catch (error) {
                    console.log(`There was an error: ${error.stack}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
                }
        })();
    }
}