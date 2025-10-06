var { MongoClient } = require("mongodb");
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

const setup = require('../../firstinit');
const img = 'set'

module.exports = {
    name: 'set',
    description: `Change the region you default to for the guessing game`,

    run: async ({ message, args, client }) => {

        const user = message.author

        var file = new AttachmentBuilder(`src/assets/command_images/${img}.png`)

        const embed = new EmbedBuilder()
            .setColor('LightGrey')
            .setThumbnail(`attachment://${img}.png`)
            .setTitle(`Set`)

        try {
            var client_db = new MongoClient(process.env.MONGODB_URI)
            var database = client_db.db("uma");
            var ids = database.collection("profiles")
            var discordID = BigInt(user.id)
            
            var newType;
            var oldType;
            var proper;

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            var options = {
                projection: {
                    _id: 0,
                    type: 1,
                }
            }

            var broadSearch = await ids.findOne({ discord_id: discordID })
            oldType = broadSearch["type"]

            if ((args.length > 0) && ((args[0].toLowerCase().includes("g")) || (args[0].toLowerCase().includes("gl")) || (args[0].toLowerCase().includes("global")))) {
                newType = 'g'
                proper = 'Global'

                embed.addFields(
                {
                    name: `\n`,
                    value: "Game region default set to " + `**${proper}**` + ".\nWhenever you use `!uma`, it will now automatically default to this region",
                    inline: true
                })
            } else if ((args.length > 0) && ((args[0].toLowerCase().includes("j")) || (args[0].toLowerCase().includes("jp")) || (args[0].toLowerCase().includes("japan")))) {
                newType = 'jp'
                proper = "Japan"

                embed.addFields(
                {
                    name: `\n`,
                    value: "Set your game region default to " + `**${proper}**` + ".\nWhenever you use `!uma`, it will now automatically default to this region",
                    inline: true
                })
            } else if ((args.length > 0) && ((args[0].toLowerCase().includes("a")) || (args[0].toLowerCase().includes("all")))) {
                newType = 'a'
                proper = "All"

                embed.addFields(
                {
                    name: `\n`,
                    value: "Set your game region default to " + `**${proper}**` + ".\nWhenever you use `!uma`, it will now automatically default to this region",
                    inline: true
                })
            } else if ((args.length > 0) && ((args[0].toLowerCase().includes("h")) || (args[0].toLowerCase().includes("horse")) || (args[0].toLowerCase().includes("i")) || (args[0].toLowerCase().includes("irl")))) {
                newType = 'h'
                proper = "IRL"

                embed.addFields(
                {
                    name: `\n`,
                    value: "Set your game region default to " + `**${proper}**` + ".\nWhenever you use `!uma`, it will now automatically default to this region",
                    inline: true
                })
            } else if (args == 0) { // No args
                newType = oldType

                embed.addFields(
                {
                    name: `\n`,
                    value: "Use this command to set the region the `!uma` command will default to when you begin a game\n\n`!set a` for umas from both JP and Global\n`!set j` for umas from only the JP server\n`!set g` for umas from only the Global server\n`!set h` for the uma's IRL counterpart",
                    inline: true
                })
            } else { // Invalid region
                newType = oldType

                embed.addFields(
                {
                    name: `\n`,
                    value: `Invalid region. Please choose ` + "`a`, `jp`, `g`, or `h`",
                    inline: true
                })
            }

            const changeType = {
                $set: {
                    type: newType
                }
            }

            await message.channel.send({ embeds: [embed], files: [file] });

            await ids.updateOne({ discord_id: discordID }, changeType);
            await client_db.close()
        } catch (error) {
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main uma error:", msg);

            try {
                await message.channel.send(
                    `**Unable to send embed**\n\nPlease check the bot's permissions and try again`
                );
            } catch (sendErr) {
                console.error("Unable to send error message:", sendErr?.message || sendErr);
            }
        }
    }
}