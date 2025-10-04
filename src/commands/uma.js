const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { MongoClient } = require("mongodb");
const path = require("path")
const fs = require('fs')

const setup = require('../../firstinit');

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/";

const gameState = new Map()
const activeChannels = new Set()

const initialBlur = 50 + 1

module.exports = {
    name: 'uma',
    description: 'Start an uma guessing game',
    aliases: ['u'],
    run: async ({ message, client, args }) => {

        let initialPointsJP;
        let minusPointsJP;

        const channelID = message.channel.id;
        const user = message.author;
        var cacheDir = path.join(__dirname, "../assets/cache")
        var originDir = path.join(__dirname, "../assets/guessing")

        var d = new Date();

        if (activeChannels.has(channelID)) {
            return message.channel.send("A game is currently running");
        }

        activeChannels.add(channelID);

        try {

            var client_db = new MongoClient(uri);

            const database = client_db.db("uma");
            const ids = database.collection("stats");
            let discordID = BigInt(user.id);

            let count = await ids.countDocuments({ discord_id: discordID });
            if (count < 1) await setup.init(discordID, "uma", "stats", client);

            const data = await ids.findOne({ discord_id: discordID }, {
                projection: {
                    wins: 1,
                    points: 1,
                    streak: 1,
                    points_today: 1,
                    wins_today: 1,
                    type: 1,
                    quickest_answer: 1,
                    username: 1,
                    vote_timer: 1,
                    strict: 1, 
                }
            });

            let list;
            let list2;
            let type;

            if ((args.length > 0) && ((args[0].toLowerCase().includes("g")) || (args[0].toLowerCase().includes("global")))) {
                    list = require('../../src/assets/global-list.json')
                    type = "Global"

                    initialPointsJP = 15 + 1
                    minusPointsJP = 3
                } else if ((args.length > 0) && ((args[0].toLowerCase().includes("j")) || (args[0].toLowerCase().includes("jp")))) {
                    list = require('../../src/assets/jp-list.json')
                    type = "Japan"

                    initialPointsJP = 25 + 1
                    minusPointsJP = 5
                } else if ((args.length > 0) && ((args[0].toLowerCase().includes("h")) || (args[0].toLowerCase().includes("horse")) || (args[0].toLowerCase().includes("i")) || (args[0].toLowerCase().includes("irl")))) {
                    list = require('../../src/assets/horse-list.json')
                    type = "IRL"

                    initialPointsJP = 30 + 1
                    minusPointsJP = 6
                } else if ((args.length > 0) && ((args[0].toLowerCase().includes("a")) || (args[0].toLowerCase().includes("all")))) {
                    list = require('../../src/assets/global-list.json')
                    list2 = require('../../src/assets/jp-list.json')
                    list = list.concat(list2)
                    type = "All"

                    initialPointsJP = 35 + 1
                    minusPointsJP = 7
                } else { // Just the normal !uma command, check their type
                    if (data["type"] === 'g') {
                        list = require('../../src/assets/global-list.json')
                        type = "Global"

                        initialPointsJP = 15 + 1
                        minusPointsJP = 3
                    } else if (data["type"] === 'jp') {
                        list = require('../../src/assets/jp-list.json')
                        type = "Japan"

                        initialPointsJP = 25 + 1
                        minusPointsJP = 5
                    } else if (data["type"] === 'h') {
                        list = require('../../src/assets/horse-list.json')
                        type = "IRL"

                        initialPointsJP = 30 + 1
                        minusPointsJP = 6
                    } else if (data["type"] === 'a') {
                        list = require('../../src/assets/global-list.json')
                        list2 = require('../../src/assets/jp-list.json')
                        list = list.concat(list2)
                        type = "All"

                        initialPointsJP = 35 + 1
                        minusPointsJP = 7
                    } else { // Defaults to global if no args + no type set
                        list = require('../../src/assets/global-list.json')
                        type = "Global"

                        initialPointsJP = 15 + 1
                        minusPointsJP = 3
                    }
                }

            var voteTimer = data['vote_timer']

            if (voteTimer + 300_000 > Date.now()) { // Checks for multiplier
                initialPointsJP = Math.floor(initialPointsJP * 1.5);
                minusPointsJP = Math.floor(minusPointsJP * 1.5);
            }
            

            var chooseChar = Math.floor(Math.random() * list.length)
            // chooseChar = 19
            var chooseImg = list[chooseChar]["images"][Math.floor(Math.random() * list[chooseChar]["images"].length)]
            var umaName = list[chooseChar]['id']
            var umaProper = list[chooseChar]['proper']

            try {
                const logChannel = await client.channels.fetch('1412306508221513729');
                if (logChannel) {
                    await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} started a game with the correct answer being ${umaProper}`)
                }
            } catch (err) {
                console.error("Log channel fetch/send error:", err);

                activeChannels.delete(channelID); // get rid of the game so they can play again
                return;
            }

            console.log(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} started a game with the correct answer being ${umaProper}`)

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

            // so like, 51-image_name(num).jpg

            try {
                if (type != "IRL") { // set special image directory for irl horse guessing
                    var imagePath = path.join(cacheDir, `${initialBlur}-${chooseImg}`); // check for existence
                    var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'blurred.jpg' });
                } else {
                    originDir = path.join(__dirname, "../assets/horses")

                    var imagePath = path.join(originDir, `${chooseImg}`); // check for existence
                    var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'blurred.jpg' });
                }
            } catch (err) {
                await message.channel.send('There was an error with the image. Skipped');
                console.error('Image file error:', err);
                
                activeChannels.delete(channelID); // get rid of the game so they can play again
                return;
            }
            
            const hint = new ButtonBuilder()
                .setCustomId('hint')
                .setLabel('Hint')
                .setStyle(ButtonStyle.Primary);

            if (type != "IRL") {
                var row = new ActionRowBuilder()
                  .addComponents(hint)
            }

            const embed = new EmbedBuilder()
                .setTitle(`Guess the Uma`)
                .setImage('attachment://blurred.jpg')
                .setColor('LightGrey')

            embed.setDescription(`Started by ${user}\n\nServer: ${type}`)

            if (type != "IRL") {
                var sentMsg = await message.channel.send({ files: [file], components: [row], embeds: [embed] })
            } else {
                var sentMsg = await message.channel.send({ files: [file], embeds: [embed] })
            }

            // const filter = (i) => i.user.id === message.author.id

            const collector = sentMsg.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60_000
            });

            const messageCollector = sentMsg.channel.createMessageCollector({
                time: 60_000
            });
            
            gameState.set(sentMsg.id, { // the start of the gameState set w/ the first edit
                blurLevel: initialBlur,
                imageName: chooseImg,
                values: list[chooseChar]["names"],
                ids: list[chooseChar]["number"],
                proper: list[chooseChar]["proper"],
                points: initialPointsJP,
                hintsUsed: 0,
                startTime: Date.now(),
            })

            // No hint button interaction for horses, so this will be skipped

            collector.on('collect', async (interaction) => { // Everytime the hint button is pressed
              try {
                    if (interaction.customId === 'hint') {
                    const state = gameState.get(sentMsg.id);
                    if (!state) return;

                    if (state.blurLevel == 1) { // if all hints have been used

                        try {
                            var imagePath = path.join(originDir, `${chooseImg}`); // fallback to default image
                            var newFile = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'original.jpg' })
                        } catch (err) {
                            await message.channel.send('There was an error with the image. Skipped');
                            console.error('Image file error:', err);

                            gameState.delete(sentMsg.id);
                            activeChannels.delete(channelID);
                            return;
                        }

                        const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                            .setImage('attachment://original.jpg')

                        await interaction.update({
                            files: [newFile], embeds: [updatedEmbed], components: [row]
                        });
                    } else { // Use a hint, go down a blur level
                        const newBlurLevel = state.blurLevel - 10
                        const newHintsUsed = state.hintsUsed + 1
                        const newPoints = state.points - minusPointsJP

                        gameState.set(sentMsg.id, {
                            ...state,
                            blurLevel: newBlurLevel,
                            hintsUsed: newHintsUsed,
                            points: newPoints
                        })

                        try {
                            var newPath = path.join(cacheDir, `${newBlurLevel}-${state.imageName}`);
                            var newFile = new AttachmentBuilder(fs.readFileSync(newPath), { name: 'blurred.jpg' });
                        } catch (err) {
                            await message.channel.send('There was an error with the image. Skipped');
                            console.error('Image file error:', err);

                            gameState.delete(sentMsg.id);
                            activeChannels.delete(channelID);
                            return;
                        }

                        const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                            .setImage('attachment://blurred.jpg')

                        await interaction.update({
                            files: [newFile], embeds: [updatedEmbed], components: [row]
                        });
                    }
                    
                }
              } catch (err) {
                console.log("Collection error: ", err)

                gameState.delete(sentMsg.id);
                activeChannels.delete(channelID);
                return;
              }
            })

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

                const originGuess = msg.content
                const userGuess = originGuess.trim().toLowerCase().replace(/\s+/g, '')
                const strictGuess = originGuess.toLowerCase()

                if (((userGuess === '!skip') || (userGuess === '!s') || (userGuess === '$skip') || (userGuess === '$s') || (userGuess === 'skip')) && (msg.author.id === user.id)) { // Skipped. Note that to skip, you have to be the author of the message, so this should work ok
                    messageCollector.stop()
                    collector.stop()

                    try {
                        const logChannel = await client.channels.fetch('1412306508221513729');
                        if (logChannel) {
                            await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Skipped with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points`)
                        }
                    } catch (err) {
                        console.error("Log channel fetch/send error:", err);

                        gameState.delete(sentMsg.id);
                        activeChannels.delete(channelID);
                        return;
                    }

                    console.log(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Skipped with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points`)

                    gameState.delete(sentMsg.id);
                    activeChannels.delete(channelID);

                    await ids.updateOne({ discord_id: discordID }, { // Remove streak if author skipped
                        $set: {
                            streak: 0,
                        }
                    });

                    try {
                        var imagePath = path.join(originDir, `${chooseImg}`);
                        var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'skipped.jpg' })
                    } catch (err) {
                        await message.channel.send('There was an error with the image. Skipped');
                        console.error('Image file error:', err);

                        gameState.delete(sentMsg.id);
                        activeChannels.delete(channelID);
                        return;
                    }

                    const skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://skipped.jpg')
                        .setFooter({ text: `Skipped! The correct answer was ${state.proper}` });

                    await sentMsg.channel.send(`Skipped, the answer was **${state.proper}**`);

                    await sentMsg.edit({
                        embeds: [skippedEmbed],
                        files: [file],
                        components: []
                    });

                    await client_db.close();
                    return
                }

                // console.log(`ID: ${msg.author.id}\nstrict?: ${client.strictCache.get(BigInt(msg.author.id))}\nNormal guess: ${userGuess}\nStrict guess: ${strictGuess}\nstate.proper.toLowercase: ${state.proper.toLowerCase()}`)
                

                if (((client.strictCache.get(BigInt(msg.author.id)) == false) && (state.values.includes(userGuess))) || ((client.strictCache.get(BigInt(msg.author.id)) == true) && (state.proper.toLowerCase() == strictGuess))) { // Got it right
                    messageCollector.stop()
                    collector.stop()

                    let timeAnswered = Date.now() - state.startTime

                    var authorID = BigInt(msg.author.id); // ID of the person who got it right

                    count = await ids.countDocuments({ discord_id: authorID });
                    if (count < 1) await setup.init(authorID, "uma", "stats", client); // Make document in case

                    var broadSearch = await ids.findOne({ discord_id: authorID })

                    try {
                        const logChannel = await client.channels.fetch('1412306508221513729');
                        if (logChannel) {
                            await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Answered by ${broadSearch["username"]} with "${originGuess}". ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, ${state.points}/${initialPointsJP} points`)
                        }
                    } catch (err) {
                        console.error("Log channel fetch/send error:", err);

                        gameState.delete(sentMsg.id);
                        activeChannels.delete(channelID);
                        return;
                    }

                    console.log(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Answered by ${broadSearch["username"]} with with "${originGuess}". ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, ${state.points}/${initialPointsJP} points`)

                    gameState.delete(sentMsg.id);
                    activeChannels.delete(channelID);

                    let topStreak = broadSearch["top_streak"]
                    let newStreak = broadSearch["streak"] + 1
                    
                    let topTime = broadSearch["quickest_answer"]
                    let newQuickest;

                    if (topTime == 0) { // If someone has a quickest answer of 0s, which shouldn't be possible (aka new users)
                        newQuickest = timeAnswered
                    } else {
                        newQuickest = Math.min(timeAnswered, topTime)
                    }

                    // Initial message sender is discordID
                    // Answerer is authorID

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

                        },
                        $push: {
                            times: timeAnswered,
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
                    
                    try {
                        var imagePath = path.join(originDir, `${chooseImg}`);
                        var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'revealed.jpg' })
                    } catch (err) {
                        await message.channel.send('There was an error with the image. Skipped');
                        console.error('Image file error:', err);

                        gameState.delete(sentMsg.id);
                        activeChannels.delete(channelID);
                        return;
                    }

                    const revealedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                        .setImage('attachment://revealed.jpg')
                        .setFooter({ text: `Guessed by ${msg.author.username} in ${(timeAnswered / 1000).toFixed(2)}s | Used ${state.hintsUsed} hints` });

                    await sentMsg.edit({
                        embeds: [revealedEmbed],
                        files: [file]
                    });

                    await client_db.close();
                }
            })

            messageCollector.on('end', async (collected, reason) => { // No one got it right. Again, the command sender should have a registered entry so this should work
                if (reason === 'time') { // Also reset the streak of the user who sent it
                    const state = gameState.get(sentMsg.id);
                    if (!state) return;

                    try {
                        const logChannel = await client.channels.fetch('1412306508221513729');
                        if (logChannel) {
                            await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - No one answered, with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points`)
                        }
                    } catch (err) {
                        console.error("Log channel fetch/send error:", err);

                        gameState.delete(sentMsg.id);
                        activeChannels.delete(channelID);
                        return;
                    }

                    console.log(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - No one answered, with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points`)

                    try {
                        var imagePath = path.join(originDir, `${chooseImg}`);
                        var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'timeout.jpg' })
                    } catch (err) {
                        await message.channel.send('There was an error with the image. Skipped');
                        console.error('Image file error:', err);

                        gameState.delete(sentMsg.id);
                        activeChannels.delete(channelID);
                        return;
                    }

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

                    await ids.updateOne({ discord_id: discordID }, {
                        $set: {
                            streak: 0
                        }
                    });

                    await client_db.close();
                }
            })

        } catch (error) { // Catch errors in the initial block
          const msg = error?.rawError?.message || error?.message || String(error);
          console.error("Main uma error:", msg);

          gameState.delete(sentMsg.id); // Should be safe to delete, no exceptions can be raised
          activeChannels.delete(channelID);

          if (error?.rawError?.message) {
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
};

module.exports.gameState = gameState
module.exports.activeChannels = activeChannels