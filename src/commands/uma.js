const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { MongoClient } = require("mongodb");
const path = require("path")
const fs = require('fs')

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
    aliases: ['u'],
    run: async ({ message }) => {

        const channelID = message.channel.id;
        const user = message.author;
        const cacheDir = path.join(__dirname, "../assets/cache");
        const originDir = path.join(__dirname, "../assets/guessing");

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
                    quickest_answer: 1,
                }
            });

            let list;
            let list2;
            let type;

            if (message.content.toLowerCase().includes("g")) {
                list = require('../../src/assets/global-list.json')
                type = "Global"

                initialPointsJP = 12 + 1
                minusPointsJP = 2
            } else if (message.content.toLowerCase().includes("j")) {
                list = require('../../src/assets/jp-list.json')
                type = "Japan"

                initialPointsJP = 24 + 1
                minusPointsJP = 4
            } else if (message.content.toLowerCase().includes("a")) {
                list = require('../../src/assets/global-list.json')
                list2 = require('../../src/assets/jp-list.json')
                list = list.concat(list2)
                type = "All"

                initialPointsJP = 30 + 1
                minusPointsJP = 5
            } else { // Just the normal !uma command, check their type
                if (data["type"] === 'g') {
                    list = require('../../src/assets/global-list.json')
                    type = "Global"

                    initialPointsJP = 12 + 1
                    minusPointsJP = 2
                } else if (data["type"] === 'jp') {
                    list = require('../../src/assets/jp-list.json')
                    type = "Japan"

                    initialPointsJP = 24 + 1
                    minusPointsJP = 4
                } else if (data["type"] === 'a') {
                    list = require('../../src/assets/global-list.json')
                    list2 = require('../../src/assets/jp-list.json')
                    list = list.concat(list2)
                    type = "All"

                    initialPointsJP = 30 + 1
                    minusPointsJP = 5
                } else { // Defaults to all chars if no args + no type set
                    list = require('../../src/assets/global-list.json')
                    list2 = require('../../src/assets/jp-list.json')
                    list = list.concat(list2)
                    type = "All"

                    initialPointsJP = 30 + 1
                    minusPointsJP = 5
                }
            }

            var chooseChar = Math.floor(Math.random() * list.length)
            var chooseImg = list[chooseChar]["images"][Math.floor(Math.random() * list[chooseChar]["images"].length)]
            var umaName = list[chooseChar]['id']
            var umaProper = list[chooseChar]['proper']

            console.log(`debug: ${umaProper}`)

            const countCollection = database.collection("count")

            await countCollection.updateOne(
                { name: umaName },
                { 
                    $inc: { count: 1 },
                    $set: { proper: umaProper }
                },
                { upsert: true }
            )

            // const top = await countCollection.find().sort({ count: -1 }).limit(5).toArray() <- logic for determining top # umas chosen

            // var chooseChar = 24
            // var chooseImg = list[chooseChar]["images"][2]
            const imagePath = path.join(cacheDir, `${initialBlur}-${chooseImg}`);

            const file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'blurred.jpg' })
            
            const hint = new ButtonBuilder()
                .setCustomId('hint')
                .setLabel('Hint')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(hint)

            const embed = new EmbedBuilder()
                .setTitle(`Guess the Uma`)
                .setImage('attachment://blurred.jpg')
                .setColor('LightGrey')

            embed.setDescription(`Started by ${user}\n\nServer: ${type}`)

            const sentMsg = await message.channel.send({ files: [file], components: [row], embeds: [embed] })

            gameState.set(sentMsg.id, {
                blurLevel: initialBlur,
                imageName: chooseImg,
                values: list[chooseChar]["names"],
                ids: list[chooseChar]["number"],
                proper: list[chooseChar]["proper"],
                points: initialPointsJP,
                hintsUsed: 0,
                startTime: Date.now(),
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

                    if (state.blurLevel == 1) { // if all hints have been used

                        const imagePath = path.join(originDir, `${chooseImg}`);
                        const newFile = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'original.jpg' })

                        const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                            .setImage('attachment://original.jpg')

                        await interaction.update({
                            files: [newFile], embeds: [updatedEmbed], components: [row]
                        });
                    } else { // Use a hint, go down a blur level
                        const newBlurLevel = state.blurLevel - 10
                        const newHintsUsed = state.hintsUsed + 1
                        const newPoints = state.points - minusPointsJP

                        const newPath = path.join(cacheDir, `${newBlurLevel}-${state.imageName}`);

                        gameState.set(sentMsg.id, {
                            ...state,
                            blurLevel: newBlurLevel,
                            hintsUsed: newHintsUsed,
                            points: newPoints
                        })

                        const newFile = new AttachmentBuilder(fs.readFileSync(newPath), { name: 'blurred.jpg' });
                        const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                            .setImage('attachment://blurred.jpg')

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

                const userGuess = msg.content.trim().toLowerCase().replace(/\s+/g, '')

                if (((userGuess === '!skip') || (userGuess === '!s')) && (msg.author.id === user.id)) { // Skipped
                    messageCollector.stop()
                    collector.stop()

                    gameState.delete(sentMsg.id);
                    activeChannels.delete(channelID);

                    await ids.updateOne({ discord_id: discordID }, { // Remove streak if author skipped
                        $set: {
                            streak: 0,
                        }
                    });

                    const imagePath = path.join(originDir, `${chooseImg}`);
                    const file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'skipped.jpg' })

                    const skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://skipped.jpg')
                        .setFooter({ text: `Skipped! The correct answer was ${state.proper}` });

                    await sentMsg.channel.send(`Skipped, the answer was **${state.proper}**`);

                    await sentMsg.edit({
                        embeds: [skippedEmbed],
                        files: [file],
                        components: []
                    });

                    await client.close();
                    return
                }

                if (state.values.includes(userGuess) || state.ids.includes == userGuess) { // Got it right
                    messageCollector.stop()
                    collector.stop()

                    gameState.delete(sentMsg.id);
                    activeChannels.delete(channelID);

                    var authorID = BigInt(msg.author.id); // ID of the person who got it right
                    
                    count = await ids.countDocuments({ discord_id: authorID });
                    if (count < 1) await setup.init(authorID, "uma", "stats"); // Make document in case

                    var broadSearch = await ids.findOne({ discord_id: authorID })

                    let topStreak = broadSearch["top_streak"]
                    let newStreak = broadSearch["streak"] + 1
                    
                    let topTime = broadSearch["quickest_answer"]
                    let timeAnswered = Date.now() - state.startTime
                    let newQuickest;

                    if (topTime == 0) { // If someone has a quickest answer of 0s, which shouldn't be possible (aka new users)
                        newQuickest = timeAnswered
                    } else {
                        newQuickest = Math.min(timeAnswered, topTime)
                    }

                    if (authorID == discordID) { // Increment streak of the answerer by one

                        await ids.updateOne({ discord_id: discordID }, {
                            $set: {
                                top_streak: Math.max(newStreak, topStreak),
                                quickest_answer: newQuickest
                            },
                            $inc: {
                                streak: 1,
                            }
                        });

                    } else { // someone else answered that's not the initial message sender, goodbye streak
                        await ids.updateOne({ discord_id: discordID }, {
                            $set: {
                                streak: 0,
                            }
                        });

                        await ids.updateOne({ discord_id: authorID }, {
                            $set: {
                                top_streak: Math.max(newStreak, topStreak),
                                quickest_answer: newQuickest
                            },
                            $inc: {
                                streak: 1,
                            }
                        });
                    }

                    const addPoints = {
                        $inc: {
                            points: state.points,
                            wins: 1,
                            points_today: state.points,
                            wins_today: 1,
                        }
                    }

                    await ids.updateOne({ discord_id: authorID }, addPoints); // update happens, i don't wanna do another findOne so we'll add the points dynamically

                    var pointCount = broadSearch["points"] + state.points
                    var winCount = broadSearch["wins"] + 1
                    var dailyPointCount = broadSearch["points_today"] + state.points
                    var dailyWinCount = broadSearch["wins_today"] + 1
                    var streakCount = broadSearch["streak"] + 1

                    await msg.channel.send(`Correct <@${authorID}>! The answer was **${state.proper}** *(+${state.points} points)*\n\nYour total points: **${pointCount}** *(${dailyPointCount} today)*\nYour total correct guesses: **${winCount}** *(${dailyWinCount} today)*\n\nCurrent Streak: **${streakCount}**`);

                    if ((newQuickest < topTime) || (topTime == 0)) { // send special message for new quickest time
                        await msg.channel.send(`You have a new fastest answer time of **${(newQuickest / 1000).toFixed(2)}** sec!`);
                    }
                    
                    const imagePath = path.join(originDir, `${chooseImg}`);
                    const file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'revealed.jpg' })

                    const revealedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://revealed.jpg')
                        .setFooter({ text: `Guessed by ${msg.author.username} in ${(timeAnswered / 1000).toFixed(2)} s, used ${state.hintsUsed} hints` });

                    await sentMsg.edit({
                        embeds: [revealedEmbed],
                        files: [file]
                    });

                    await client.close();
                }
            })

            messageCollector.on('end', async (collected, reason) => { // No one got it right
                if (reason === 'time') {
                    const state = gameState.get(sentMsg.id);
                    if (!state) return;

                    const imagePath = path.join(originDir, `${chooseImg}`);
                    const file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'timeout.jpg' })

                    const timeoutEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://timeout.jpg')
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