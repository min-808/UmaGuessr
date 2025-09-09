var { MongoClient } = require("mongodb");
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');

const setup = require('../../firstinit');
const img = 'set'

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    name: 'set',
    description: `Change the region you default to for the guessing game`,

    data: new SlashCommandBuilder()
        .setName('set')
        .setDescription('Change the region you default to for the guessing game')
        .addStringOption(option =>
            option.setName('region')
                .setDescription('Choose which region you want the command to default to')
                .addChoices(
                    { name: 'Global', value: 'g' },
                    { name: 'Japan', value: 'j' },
                    { name: 'All', value: 'a' },
                    { name: 'Help', value: 'help' },
                )),

    run: async ({ interaction, client }) => {

        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .setTitle(`Set`)

        try {
            await interaction.deferReply()

            var client_db = new MongoClient(uri)
            var database = client_db.db("uma");
            var ids = database.collection("stats")
            var discordID = BigInt(interaction.user.id)
            
            var newType;
            var oldType;
            var proper;

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats", client);

            var options = {
                projection: {
                    _id: 0,
                    type: 1,
                }
            }

            var broadSearch = await ids.findOne({ discord_id: discordID })
            oldType = broadSearch["type"]

            if (interaction.options.getString('region') == "g") {
                newType = 'g'
                proper = 'Global'

                embed.addFields(
                {
                    name: `\n`,
                    value: "Game region default set to " + `**${proper}**` + ".\nWhenever you use `/uma`, it will now automatically default to this region",
                    inline: true
                })
            } else if (interaction.options.getString('region') == "j") {
                newType = 'jp'
                proper = "Japan"

                embed.addFields(
                {
                    name: `\n`,
                    value: "Set your game region default to " + `**${proper}**` + ".\nWhenever you use `/uma`, it will now automatically default to this region",
                    inline: true
                })
            } else if (interaction.options.getString('region') == "a") {
                newType = 'a'
                proper = "All"

                embed.addFields(
                {
                    name: `\n`,
                    value: "Set your game region default to " + `**${proper}**` + ".\nWhenever you use `/uma`, it will now automatically default to this region",
                    inline: true
                })
            } else if (interaction.options.getString('region') == "help") { // No args
                newType = oldType

                embed.addFields(
                {
                    name: `\n`,
                    value: "Use this command to set the region the `/uma` command will default to when you begin a game\n\n`/set All` for umas from both JP and Global\n`/set Japan` for umas from only the JP server\n`/set Global` for umas from only the Global server",
                    inline: true
                })
            } else { // Invalid region
                newType = oldType

                embed.addFields(
                {
                    name: `\n`,
                    value: `Invalid region. Please choose ` + "`a`, `jp`, or `g`",
                    inline: true
                })
            }

            const changeType = {
                $set: {
                    type: newType
                }
            }

            await interaction.editReply({ embeds: [embed], files: [file] });

            await ids.updateOne({ discord_id: discordID }, changeType);
            await client_db.close()
        } catch (error) {
            const msg = error?.message || String(error);
            console.error("Main uma error:", msg);

            // Send ephemeral fallback safely
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply(`Unable to send message: **${msg}**`);
                } else {
                    await interaction.reply({ content: `Unable to send message: **${msg}**`, flags: 64 });
                }
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}