var { MongoClient } = require("mongodb");
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const setup = require('../../firstinit');
const img = 'strict'

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'strict',
    description: `Toggle strict guessing mode`,

    data: new SlashCommandBuilder()
        .setName('strict')
        .setDescription('Toggle strict guessing mode`'),

    run: async ({ interaction, client }) => {

        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .setTitle(`\n`)

        try {
            await interaction.deferReply()

            var client_db = new MongoClient(uri)
            var database = client_db.db("uma");
            var ids = database.collection("profiles")
            var discordID = BigInt(interaction.user.id)

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            var options = {
                projection: {
                    _id: 0,
                    type: 1,
                }
            }

            var broadSearch = await ids.findOne({ discord_id: discordID })
            strictType = broadSearch["strict"]

            if (strictType == false) {
                embed.addFields(
                  {
                      name: `\n`,
                      value: "**Strict** guessing mode has been enabled\n\nWhenever you guess, you will have to spell out the character's **full name** with **proper spacing**, including any **symbols**",
                  })
                embed.setFooter({ text: "Use the command again to toggle the mode on/off" })

                client.strictCache.set(discordID, true)
            } else {
                embed.addFields(
                {
                    name: `\n`,
                    value: "**Strict** guessing mode has been disabled",
                })

                client.strictCache.set(discordID, false)
            }

            const changeStrict = {
                $set: {
                    strict: !strictType
                }
            }

            await interaction.editReply({ embeds: [embed], files: [file] });

            await ids.updateOne({ discord_id: discordID }, changeStrict);
            await client_db.close()
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`**Unable to send embed**\n\nPlease check the bot's permissions and try again`);
                } else {
                    await interaction.reply({ content: `**Unable to send embed**\n\nPlease check the bot's permissions and try again`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}