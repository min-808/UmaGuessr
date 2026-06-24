const { EmbedBuilder, AttachmentBuilder, SlashCommandBuilder, escapeMarkdown } = require('discord.js');
const { getMongoClient } = require('../connect-db.js');

const setup = require('../../firstinit');

module.exports = {
    name: 'profile',
    aliases: ['p'],
    description: 'Show your bot game stats',

    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Show your bot game stats')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The profile you want to search. Leave empty for your own profile')
                .setRequired(false)
        ),

    run: async ({ interaction, client }) => {
        const user = interaction.user;
        var data

        const embed = new EmbedBuilder()
            .setColor('LightGrey')

        try {
            await interaction.deferReply()

            var client_db = new getMongoClient()
            const database = client_db.db("uma");
            const ids = database.collection("profiles");
            var discordID = BigInt(user.id);

            var globalList = require('../../src/assets/global-list.json')
            var JPList = require('../../src/assets/jp-list.json')
            var bothLists = globalList.concat(JPList)

            let properName = "N/A"

            var userProvided
            var d

            const count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "profiles", client);

            if (interaction.options.getString('name') != null) {
                var mentionMatch = interaction.options.getString('name').match(/^<@!?(\d+)>$/)
                if (mentionMatch) { // if it's a mention
                    discordID = BigInt(mentionMatch[1])
                    console.log(discordID)
                } else if (interaction.options.getString('name').match(/^\d{17,19}$/)) { // possibly just an id?, regex fuckery (number between 17 and 19 digits incl)
                    discordID = BigInt(interaction.options.getString('name'))
                } else { // not a number with 17-19 digits, so possibly a username string
                    userProvided = interaction.options.getString('name').toLowerCase()
                }
            }

            if (userProvided) { // username case
                data = await ids.findOne({ username: userProvided }, {
                    projection: {
                        discord_id: 1,
                        wins: 1,
                        points: 1,
                        streak: 1,
                        points_today: 1,
                        wins_today: 1,
                        top_streak: 1,
                        quickest_answer: 1,
                        times: 1,
                        inventory: 1,
                        username: 1,
                        signup: 1,
                        restrict: 1,
                        quote: 1,
                        favorites: 1,
                        max_favorites: 1,
                        user_id: 1,
                    }
                });

                if (!data) { // Checker for random string
                    interaction.editReply(`Invalid Discord username provided, or the user has not played yet`)
                    return
                }

                userProvided = data["username"]
                discordID = data['discord_id']
                d = new Date(data['signup'])
            } else { // ID case
                data = await ids.findOne({ discord_id: discordID }, {
                    projection: {
                        wins: 1,
                        points: 1,
                        streak: 1,
                        points_today: 1,
                        wins_today: 1,
                        top_streak: 1,
                        quickest_answer: 1,
                        times: 1,
                        inventory: 1,
                        username: 1,
                        signup: 1,
                        restrict: 1,
                        quote: 1,
                        favorites: 1,
                        max_favorites: 1,
                        user_id: 1,
                    }
                });

                if (!data) { // Checker for random id
                    interaction.editReply(`Invalid Discord ID provided, or the user has not played yet`)
                    return
                }

                userProvided = data["username"]
                d = new Date(data['signup'])
            }

            const response = await fetch(`https://discord.com/api/v10/users/${discordID}`, {
                    headers: {
                        'Authorization': 'Bot ' + process.env.TOKEN
                    }
                });

            const parse = await response.json()
            
            embed.setThumbnail(`https://cdn.discordapp.com/avatars/${discordID}/${parse.avatar}.png`)

            const utcDate = `${(d.getUTCMonth() + 1).toString().padStart(2, '0')}/${d.getUTCDate().toString().padStart(2,'0')}/${d.getUTCFullYear()}`;
            const utcTime = `${d.getUTCHours().toString().padStart(2,'0')}:${d.getUTCMinutes().toString().padStart(2,'0')}:${d.getUTCSeconds().toString().padStart(2,'0')}`;

            let allUsers = await ids.find({}, { projection: { discord_id: 1, points: 1, restrict: 1, } })
                .sort({ points: -1 })
                .toArray();

            const { wins, points, streak, points_today, wins_today, top_streak, quickest_answer, times, restrict, quote, favorites, max_favorites, user_id } = data;
            let rank

            if (restrict) {
                rank = `0 **(Restricted)**`
            } else {
                allUsers = allUsers.filter(item => item.restrict != true)
                rank = allUsers.findIndex(entry => entry.discord_id.toString() === discordID.toString()) + 1;
            }

            let quickest;
            let avg;

            switch (true) {
                case (points < 100):
                    rankSymbol = "<:g_rank:1438093909648474162>";
                    break;
                case (points < 500):
                    rankSymbol = "<:f_rank:1438093911284519013>";
                    break;
                case (points < 1000):
                    rankSymbol = "<:e_rank:1438093913331208232>";
                    break;
                case (points < 5000):
                    rankSymbol = "<:d_rank:1438093914564464670>";
                    break;
                case (points < 10000):
                    rankSymbol = "<:c_rank:1438093915939930152>";
                    break;
                case (points < 20000):
                    rankSymbol = "<:b_rank:1438093918276419584>";
                    break;
                case (points < 50000):
                    rankSymbol = "<:a_rank:1438093920079970415>";
                    break;
                case (points < 100000):
                    rankSymbol = "<:s_rank:1438093922030190622>";
                    break;
                case (points < 250000):
                    rankSymbol = "<:ss_rank:1438093923896786975>";
                    break;
                case (points < 300000):
                    rankSymbol = "<:ug_rank:1438093925113008138>";
                    break;
                case (points < 375000):
                    rankSymbol = "<:uf_rank:1438093926639861770>";
                    break;
                case (points < 475000):
                    rankSymbol = "<:ue_rank:1438093928560721980>";
                    break;
                case (points < 600000):
                    rankSymbol = "<:ud_rank:1438093930314072084>";
                    break;
                case (points < 750000):
                    rankSymbol = "<:uc_rank:1438093932671139901>";
                    break;
                case (points < 950000):
                    rankSymbol = "<:ub_rank:1438093934395133973>";
                    break;
                case (points < 1200000):
                    rankSymbol = "<:ua_rank:1438093935300841534>";
                    break;
                default:
                    rankSymbol = "<:us_rank:1438093937419227156>";
                    break;
            }
            
            if (quickest_answer == 0 && times.length < 5) { // Nothing
                quickest = 'n/a'
                avg = '**n/a**'
            } else if (quickest_answer != 0 && times.length < 5) { // A few guesses
                quickest = `${(quickest_answer / 1000).toFixed(2)} sec`
                avg = `**n/a**\n\\- *(Correctly guess ${5 - times.length} more times to get an average time)*`
            } else {
                quickest = `${(quickest_answer / 1000).toFixed(2)} sec`
                const sum = times.reduce((a, b) => a + b, 0)
                avg = `**${(((sum / times.length) || 0) / 1000).toFixed(2)} sec**`
            }

            embed.setTitle(`**${escapeMarkdown(userProvided)}'s Profile**`)

            if (quote != null && quote.trim() !== '') {
                embed.addFields(
                    {
                        name: `\n`,
                        value: `*${quote}*`,
                        inline: true
                    },
                    {
                        name: `\n`,
                        value: `\n`,
                    },
                )
            } else {
                embed.addFields(
                    {
                        name: `\n`,
                        value: `*No quote set*`,
                        inline: true
                    },
                    {
                        name: `\n`,
                        value: `\n`,
                    },
                )
            }

            if (favorites.length != 0) {
                properName = favorites.map(item => bothLists.find(entry => entry.id == item)['proper']).join('\n')

                embed.addFields(
                    {
                        name: `__Rank__`,
                        value: `#${rank} ${rankSymbol}`,
                        inline: true
                    },
                    {
                        name: `\n`,
                        value: `\n`,
                        inline: true
                    },
                    {
                        name: `__Favorite Umas (${favorites.length}/${max_favorites})__`,
                        value: `${properName}`,
                        inline: true,
                    },
                    {
                        name: `\n`,
                        value: `\n`,
                    },
                )
            } else {
                embed.addFields(
                    {
                        name: `__Rank__`,
                        value: `#${rank} ${rankSymbol}`,
                        inline: true
                    },
                    {
                        name: `\n`,
                        value: `\n`,
                        inline: true
                    },
                    {
                        name: `__Favorite Umas (${favorites.length}/${max_favorites})__`,
                        value: `None set`,
                        inline: true,
                    },
                    {
                        name: `\n`,
                        value: `\n`,
                    },
                )
            }

            embed.addFields(
                {
                    name: "__Stats__",
                    value: `Total points: **${points}** *(+${points_today} today)*\nTotal wins: **${wins}** *(+${wins_today} today)*\nFastest answer: **${quickest}**\nAverage answer time: ${avg}`
                },
                {
                    name: `\n`,
                    value: `\n`,
                },
                {
                    name: "__Streak__",
                    value: `Top streak: **${top_streak}**\nCurrent streak: **${streak}**`,
                }
            );

            embed.setFooter({ text: `Joined on ${utcDate} at ${utcTime} UTC | ID #${user_id}` })

            await interaction.editReply({ embeds: [embed] })
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
};
