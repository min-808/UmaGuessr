const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { MongoClient } = require("mongodb");
const Jimp = require("jimp")
const path = require("path")

const setup = require('../../firstinit');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

const gameState = new Map()
const activeChannels = new Set()

const initialBlur = 60 + 1
let initialPointsJP;
let minusPointsJP;

module.exports = {
    name: 'uma',
    description: 'Start an uma guessing game',
    run: async ({ message }) => {

        const channelID = message.channel.id;
        const user = message.author;

        if (activeChannels.has(channelID)) {
            return message.channel.send("a game is running brochado");
        }

        activeChannels.add(channelID);

        try {

            const client = new MongoClient(uri);

            const database = client.db("uma");
            const ids = database.collection("stats");
            let discordID = BigInt(user.id);

            let count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats");

            const data = await ids.findOne({ discord_id: discordID }, {
                projection: {
                    wins: 1,
                    points: 1,
                    streak: 1,
                    points_today: 1,
                    wins_today: 1,
                    type: 1,
                }
            });

            let list;
            let type;

            if (data["type"] === 'jp') {
                list = require('../../src/assets/jp-list.json')
                type = "JP"

                initialPointsJP = 24 + 1
                minusPointsJP = 4
            } else if (data["type"] === 'g') {
                list = require('../../src/assets/global-list.json')
                type = "Global"

                initialPointsJP = 12 + 1
                minusPointsJP = 2
            } else {
                if (message.content.toLowerCase().includes("g")) {
                    list = require('../../src/assets/global-list.json')
                    type = "Global"

                    initialPointsJP = 12 + 1
                    minusPointsJP = 2
                } else if (message.content.toLowerCase().includes("j")) {
                    list = require('../../src/assets/jp-list.json')
                    type = "JP"

                    initialPointsJP = 24 + 1
                    minusPointsJP = 4
                } else {
                    list = require('../../src/assets/jp-list.json')
                    type = "JP"

                    initialPointsJP = 24 + 1
                    minusPointsJP = 4
                }
            }

            var chooseChar = Math.floor(Math.random() * list.length)
            var chooseImg = list[chooseChar]["images"][Math.floor(Math.random() * list[chooseChar]["images"].length)]

            const image = await Jimp.read(path.join(__dirname, `../assets/guessing/${chooseImg}`))

            image.pixelate(initialBlur)
            const buffer = await image.getBufferAsync(Jimp.MIME_PNG);

            const file = new AttachmentBuilder(buffer, { name: 'blurred.png' })
            
            const hint = new ButtonBuilder()
                .setCustomId('hint')
                .setLabel('Unblur')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(hint)

            const embed = new EmbedBuilder()
                .setTitle(`Guess the Uma`)
                .setImage('attachment://blurred.png')
                .setColor('LightGrey')

            embed.setDescription(`Started by ${user}\n\nServer: ${type}`)

            const sentMsg = await message.channel.send({ files: [file], components: [row], embeds: [embed] })

            gameState.set(sentMsg.id, {
                blurLevel: initialBlur,
                imageName: chooseImg,
                values: list[chooseChar]["names"],
                proper: list[chooseChar]["proper"],
                points: initialPointsJP,
                hintsUsed: 0,
            })

            // const filter = (i) => i.user.id === message.author.id

            const collector = sentMsg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60_000
            });

            collector.on('collect', async (interaction) => { // Everytime the hint button is pressed
                if (interaction.customId === 'hint') {
                    const state = gameState.get(sentMsg.id);
                    if (!state) return;

                    if (state.blurLevel == 1) {
                        const newImage = await Jimp.read(path.join(__dirname, `../assets/guessing/${state.imageName}`));
                        const newBuffer = await newImage.getBufferAsync(Jimp.MIME_PNG);

                        const newFile = new AttachmentBuilder(newBuffer, { name: 'original.png' });
                        const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                            .setImage('attachment://original.png')

                        await interaction.update({
                            files: [newFile], embeds: [updatedEmbed], components: [row]
                        });
                    } else {
                        const newBlurLevel = state.blurLevel - 10
                        const newHintsUsed = state.hintsUsed + 1
                        const newPoints = state.points - minusPointsJP

                        const newImage = await Jimp.read(path.join(__dirname, `../assets/guessing/${state.imageName}`));
                        newImage.pixelate(newBlurLevel);
                        const newBuffer = await newImage.getBufferAsync(Jimp.MIME_PNG);

                        gameState.set(sentMsg.id, {
                            ...state,
                            blurLevel: newBlurLevel,
                            hintsUsed: newHintsUsed,
                            points: newPoints
                        })

                        const newFile = new AttachmentBuilder(newBuffer, { name: 'blurred.png' });
                        const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                            .setImage('attachment://blurred.png')

                        await interaction.update({
                            files: [newFile], embeds: [updatedEmbed], components: [row]
                        });
                    }
                    
                }
            })

            const messageCollector = sentMsg.channel.createMessageCollector({
                time: 60_000
            });

            setTimeout(() => {
                if (gameState.has(sentMsg.id)) {
                    sentMsg.channel.send("30 seconds left");
                }
            }, 30_000);

            setTimeout(() => {
                if (gameState.has(sentMsg.id)) {
                    sentMsg.channel.send("10 seconds left");
                }
            }, 50_000);

            messageCollector.on('collect', async (msg) => { // Collect guesses
                const state = gameState.get(sentMsg.id);
                if (!state) return;

                const userGuess = msg.content.trim().toLowerCase()

                if ((userGuess === '!skip') && (msg.author.id === user.id)) {
                    messageCollector.stop()
                    collector.stop()

                    const finalImage = await Jimp.read(path.join(__dirname, `../assets/guessing/${state.imageName}`));
                    const finalBuffer = await finalImage.getBufferAsync(Jimp.MIME_PNG);
                    const file = new AttachmentBuilder(finalBuffer, { name: 'skipped.png' });

                    const skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://skipped.png')
                        .setFooter({ text: `Skipped! The correct answer was ${state.proper}` });

                    await sentMsg.channel.send(`Character skipped. The answer was **${state.proper}**`);

                    await sentMsg.edit({
                        embeds: [skippedEmbed],
                        files: [file],
                        components: []
                    });

                    gameState.delete(sentMsg.id);
                    activeChannels.delete(channelID);
                    await client.close();
                    return
                }

                if (state.values.includes(userGuess)) { // Got it right
                    messageCollector.stop()
                    collector.stop()

                    authorID = BigInt(msg.author.id);
                    count = await ids.countDocuments({ discord_id: authorID });

                    if (count < 1) await setup.init(authorID, "uma", "stats");

                    const addPoints = {
                        $inc: {
                            points: state.points,
                            wins: 1,
                            points_today: state.points,
                            wins_today: 1,
                        }
                    }

                    await ids.updateOne({ discord_id: authorID }, addPoints);
                    var broadSearch = await ids.findOne({ discord_id: authorID });

                    var pointCount = broadSearch["points"]
                    var winCount = broadSearch["wins"]
                    var dailyPointCount = broadSearch["points_today"]
                    var dailyWinCount = broadSearch["wins_today"]

                    await msg.channel.send(`Correct <@${authorID}>! The answer was **${state.proper}** *(+${state.points} points)*
                        \nYour total points: **${pointCount}** *(${dailyPointCount} today)*\nYour total correct guesses: **${winCount}** *(${dailyWinCount} today)*`);

                    const fullImage = await Jimp.read(path.join(__dirname, `../assets/guessing/${state.imageName}`));
                    const fullBuffer = await fullImage.getBufferAsync(Jimp.MIME_PNG);
                    const file = new AttachmentBuilder(fullBuffer, { name: 'revealed.png' });

                    const revealedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://revealed.png')
                        .setFooter({ text: `Guessed by ${msg.author.username}, used ${state.hintsUsed} hints` });

                    await sentMsg.edit({
                        embeds: [revealedEmbed],
                        files: [file]
                    });

                    gameState.delete(sentMsg.id)
                    activeChannels.delete(channelID)

                    await client.close();
                }
            })

            messageCollector.on('end', async (collected, reason) => { // No one got it right
                if (reason === 'time') {
                    const state = gameState.get(sentMsg.id);
                    if (!state) return;

                    const finalImage = await Jimp.read(path.join(__dirname, `../assets/guessing/${state.imageName}`));
                    const finalBuffer = await finalImage.getBufferAsync(Jimp.MIME_PNG);
                    const file = new AttachmentBuilder(finalBuffer, { name: 'timeout.png' });

                    const timeoutEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://timeout.png')
                        .setFooter({ text: `Time's up! The correct answer was ${state.proper}` });

                    await sentMsg.channel.send(`Nobody got it right. The answer was **${state.proper}**`);

                    await sentMsg.edit({
                        embeds: [timeoutEmbed],
                        files: [file],
                        components: []
                    });

                    gameState.delete(sentMsg.id);
                    activeChannels.delete(channelID);

                    await client.close();
                }
            })

        } catch (err) {
            console.error(err);
            message.channel.send("Something went wrong.");
            activeChannels.delete(channelID);
            await client.close()
        }
    }
};

module.exports.gameState = gameState
module.exports.activeChannels