const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { MongoClient } = require('mongodb')
const buttonPagination = require('../../button-pagination');

module.exports = {
    name: 'charlist',
    aliases: ['characterlist', 'clist', 'cl'],
    description: 'Shows all umas that have been added to the bot and their picture counts',

    data: new SlashCommandBuilder()
        .setName('charlist')
        .setDescription('Shows all umas that have been added to the bot and their picture counts')
        .addStringOption(option =>
            option.setName('option')
                .setDescription('Choose which format you want to view the character list in')
                .addChoices(
                    { name: 'Total Images', value: 'images' },
                    { name: 'Win Rate', value: 'winrate' },
                )),
    
    run: async ({ interaction }) => {

        try {

            const sent = await interaction.deferReply()

            var client_db = new MongoClient(process.env.MONGODB_URI)
            var database = client_db.db("uma");
            var ids = database.collection("count")

            var list = await ids.find({}, {
                projection: {
                    name: 1,
                    proper: 1,
                    count: 1,
                    wins: 1,
                }
            }).toArray();

            var globalList = require('../../src/assets/global-list.json')
            var JPList = require('../../src/assets/jp-list.json')

            const firstThirdJP = JPList.slice(0, Math.ceil(JPList.length / 3));
            const secondThirdJP = JPList.slice(Math.ceil(JPList.length / 3), Math.ceil((JPList.length * 2) / 3));
            const thirdThirdJP = JPList.slice(Math.ceil((JPList.length * 2) / 3), JPList.length);

            const firstThirdGlobal = globalList.slice(0, Math.ceil(globalList.length / 3));
            const secondThirdGlobal = globalList.slice(Math.ceil(globalList.length / 3), Math.ceil((globalList.length * 2) / 3));
            const thirdThirdGlobal = globalList.slice(Math.ceil((globalList.length * 2) / 3), globalList.length);

            var embeds = []

            if (interaction.options.getString('option') == "winrate") {
                let winRateGlobal = new EmbedBuilder()
                    .setColor('LightGrey')
                    .setTitle("List of Umas (WinRate%)")
                    .addFields(
                        {
                            name: "__Global__",
                            value: firstThirdGlobal.map(c => {
                                const found = list.find(obj => obj.name === c.id)

                                const wins = found?.wins ?? 0
                                const count = found?.count ?? 0

                                const rate = count > 0 ? (wins / count) * 100 : 0

                                return `${c.proper} **(${rate.toFixed(1)}%)**`;
                            }).join("\n") || "N/A",
                            inline: true
                        },
                        {
                            name: "​",
                            value: secondThirdGlobal.map(c => {
                                const found = list.find(obj => obj.name === c.id)

                                const wins = found?.wins ?? 0
                                const count = found?.count ?? 0

                                const rate = count > 0 ? (wins / count) * 100 : 0

                                return `${c.proper} **(${rate.toFixed(1)}%)**`;
                            }).join("\n") || "N/A",
                            inline: true
                        },
                        {
                            name: "​",
                            value: thirdThirdGlobal.map(c => {
                                const found = list.find(obj => obj.name === c.id)

                                const wins = found?.wins ?? 0
                                const count = found?.count ?? 0

                                const rate = count > 0 ? (wins / count) * 100 : 0

                                return `${c.proper} **(${rate.toFixed(1)}%)**`;
                            }).join("\n") || "N/A",
                            inline: true
                        },
                    )

                let winRateJP = new EmbedBuilder()
                .setColor('LightGrey')
                .setTitle("List of Umas (WinRate%)")
                .addFields(
                    {
                        name: "__Japan__",
                        value: firstThirdJP.map(c => {
                            const found = list.find(obj => obj.name === c.id)

                            const wins = found?.wins ?? 0
                            const count = found?.count ?? 0

                            const rate = count > 0 ? (wins / count) * 100 : 0

                            return `${c.proper} **(${rate.toFixed(1)}%)**`;
                        }).join("\n") || "N/A",
                        inline: true
                      },
                      {
                          name: "​",
                          value: secondThirdJP.map(c => {
                              const found = list.find(obj => obj.name === c.id)

                              const wins = found?.wins ?? 0
                              const count = found?.count ?? 0

                              const rate = count > 0 ? (wins / count) * 100 : 0

                              return `${c.proper} **(${rate.toFixed(1)}%)**`;
                          }).join("\n") || "N/A",
                          inline: true
                      },
                      {
                          name: "​",
                          value: thirdThirdJP.map(c => {
                              const found = list.find(obj => obj.name === c.id)

                              const wins = found?.wins ?? 0
                              const count = found?.count ?? 0

                              const rate = count > 0 ? (wins / count) * 100 : 0

                              return `${c.proper} **(${rate.toFixed(1)}%)**`;
                          }).join("\n") || "N/A",
                          inline: true
                      },
                  )

                  embeds.push(
                        { embed: winRateGlobal },
                        { embed: winRateJP },
                    );
            } else {
                let countGlobal = new EmbedBuilder()
                    .setColor('LightGrey')
                    .setTitle("List of Umas (# of pics)")
                    .addFields(
                        {
                            name: "__Global__",
                            value: firstThirdGlobal.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                            inline: true
                        },
                        {
                            name: "​",
                            value: secondThirdGlobal.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                            inline: true
                        },
                        {
                            name: "​",
                            value: thirdThirdGlobal.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                            inline: true
                        },
                    )

                let countJP = new EmbedBuilder()
                    .setColor('LightGrey')
                    .setTitle("List of Umas (# of pics)")
                    .addFields(
                        {
                            name: "__Japan__",
                            value: firstThirdJP.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                            inline: true
                        },
                        {
                            name: "​",
                            value: secondThirdJP.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                            inline: true
                        },
                        {
                            name: "​",
                            value: thirdThirdJP.map(c => `${c.proper} **(${c.images.length})**`).join("\n") || "N/A",
                            inline: true
                        },
                    )
                    
                    embeds.push(
                        { embed: countGlobal },
                        { embed: countJP },
                    );
              }

            await buttonPagination(sent, embeds);
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