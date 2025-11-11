const { RegExpMatcher, TextCensor, englishDataset, englishRecommendedTransformers } = require('obscenity');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js')
const { getMongoClient } = require('../connect-db.js')

const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

const img = "discord"

module.exports = {
    name: 'setquote',
    aliases: ['quote', 'sq'],
    description: 'Set a quote for your profile',
    
    run: async ({ message, args }) => {
        const user = message.author

        try {
            var client_db = new getMongoClient();
            const database = client_db.db("uma");
            const ids = database.collection("profiles");
            var discordID = BigInt(user.id);

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            const file = new AttachmentBuilder(`src/assets/command_images/${img}.png`);

            let embed;
            let msg
            let linkRegex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/

            embed = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("Set Quote")
                .setThumbnail(`attachment://${img}.png`)

            msg = args.join(' ')

            if (matcher.hasMatch(msg)) { // bad word checker
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Unable to set profile quote**\n\nThe text contains profanity"
                    }
                )

                console.log(`Blocked: User ID ${user} tried changing their quote to: ${msg}`)
            } else if (msg.length >= 200) {
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Unable to set profile quote**\n\nThe text is longer than 200 characters"
                    }
                )
            } else if (msg.length == 0) {
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Your profile quote has been reset**"
                    }
                )

                await ids.updateOne({ discord_id: discordID },
                    { $set: { quote: null } },
                    { upsert: true }
                );
            } else if (linkRegex.test(msg)) {
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Unable to set profile quote**\n\nThe text contains a clickable link"
                    }
                )
            } else {
                embed.addFields(
                    {
                        name: "\n",
                        value: "**Successfully changed profile quote**"
                    }
                )

                await ids.updateOne({ discord_id: discordID },
                    { $set: { quote: msg } },
                    { upsert: true }
                );
            }

            await message.channel.send({ embeds: [embed], files: [file] });
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