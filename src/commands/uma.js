const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { getMongoClient } = require('../connect-db.js');
const { returnRankedMessage } = require('../misc.js');
const setup = require('../../firstinit');
const path = require("path")
const fs = require('fs')

const gameState = new Map()
const activeChannels = new Set()

module.exports = {
    name: 'uma',
    description: 'Start an uma guessing game',
    aliases: ['u'],
    run: async ({ message, client, args }) => {

        startGame(message, client, args, null, true, false)

        async function startGame(message, client, args, buttonUser = null, initial = false, autoplay = false) {
            let initialPointsJP;
            let minusPointsJP;
            var initialBlur = 50 + 1

            let umaMap
            let toStopAutoplay = false

            const channelID = message.channel.id;
            let user

            if (buttonUser == null) {
                user = message.author;
            } else {
                user = buttonUser;
            }

            var cacheDir = path.join(__dirname, "../assets/cache")
            var originDir = path.join(__dirname, "../assets/guessing")

            var d = new Date();

            try {
                var client_db = new getMongoClient();

                const database = client_db.db("uma");
                const ids = database.collection("profiles");
                let discordID = BigInt(user.id);

                let count = await ids.countDocuments({ discord_id: discordID });
                if (count < 1) await setup.init(discordID, "uma", "profiles", client);

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
                        restrict: 1,
                        favorites: 1,
                        sample: 1,
                    }
                });

                var errorEmbed = new EmbedBuilder()
                    .setTitle("\n")
                    .addFields({
                        name: "\n",
                        value: `There was an error with the image. Skipped`
                    })
                    .setColor("LightGrey")

                var favEmbed = new EmbedBuilder()
                    .setTitle("\n")
                    .addFields({
                        name: "\n",
                        value: ':star: You guessed one of your **favorite** umas! *(+15 points)*'
                    })
                    .setColor("LightGrey")

                var sampleEmbed = new EmbedBuilder()
                    .setTitle("\n")
                    .addFields({
                        name: "\n",
                        value: ':star: You guessed one of your **favorite** umas! *(+0 points)*'
                    })
                    .setColor("LightGrey")

                var autoPlayStoppedEmbed = new EmbedBuilder()
                    .setTitle("\n")
                    .addFields({
                        name: "\n",
                        value: '**Autoplay** has been **stopped**\n\nMake sure to finish the current game!'
                    })
                    .setColor("LightGrey")

                var reminder30 = new EmbedBuilder()
                    .setTitle("\n")
                    .addFields({
                        name: "\n",
                        value: `30 seconds left`
                    })
                    .setColor("LightGrey")

                var reminder10 = new EmbedBuilder()
                    .setTitle("\n")
                    .addFields({
                        name: "\n",
                        value: `10 seconds left`
                    })
                    .setColor("LightGrey")

                if (activeChannels.has(channelID)) {
                    var runningEmbed = new EmbedBuilder()
                        .setTitle("\n")
                        .addFields({
                            name: "\n",
                            value: `A game is currently running`
                        })
                        .setColor("LightGrey")

                    return message.channel.send({ embeds: [runningEmbed] });
                }

                activeChannels.add(channelID);

                setTimeout(() => { activeChannels.delete(channelID) }, 75 * 1000); // auto-remove after 1m 10s

                var logChannel = await client.channels.fetch(process.env.UMA_LOG_CHANNEL)
                var cmdLogChannel = await client.channels.fetch(process.env.CMD_LOG_CHANNEL) 

                let list;
                let list2;
                let type;

                if ((args.length > 0) && (((args[0].length == 1) && (args[0].toLowerCase() == "g")) || (args[0].toLowerCase().includes("global")))) {
                        list = require('../../src/assets/global-list.json')
                        type = "Global"

                        initialPointsJP = 15 + 1
                        minusPointsJP = 3
                    } else if ((args.length > 0) && (((args[0].length == 1) && (args[0].toLowerCase() == "j")) || (args[0].toLowerCase().includes("jp")) || (args[0].toLowerCase().includes("japan")))) {
                        list = require('../../src/assets/jp-list.json')
                        type = "Japan"

                        initialPointsJP = 25 + 1
                        minusPointsJP = 5
                    } else if ((args.length > 0) && (((args[0].length == 1) && (args[0].toLowerCase() == "h")) || ((args[0].length == 1) && (args[0].toLowerCase() == "i")) || (args[0].toLowerCase().includes("irl")) || (args[0].toLowerCase().includes("horse")))) {
                        list = require('../../src/assets/horse-list.json')
                        type = "IRL"

                        initialPointsJP = 30 + 1
                        minusPointsJP = 6
                    } else if ((args.length > 0) && (((args[0].length == 1) && (args[0].toLowerCase() == "a")) || (args[0].toLowerCase().includes("all")))) {
                        list = require('../../src/assets/global-list.json')
                        list2 = require('../../src/assets/jp-list.json')
                        list = list.concat(list2)
                        type = "All"

                        initialPointsJP = 35 + 1
                        minusPointsJP = 7
                    } else if ((args.length > 0) && (((args[0].length == 1) && (args[0].toLowerCase() == "v")) || (args[0].toLowerCase().includes("voice")))) {
                        list = require('../../src/assets/voice-list.json')
                        type = "Voice"

                        initialPointsJP = 25 + 1
                        minusPointsJP = 5
                    } else if ((args.length > 0) && (((args[0].length == 1) && (args[0].toLowerCase() == "m")) || (args[0].toLowerCase().includes("multi")))) {
                        list = require('../../src/assets/global-list.json')
                        list2 = require('../../src/assets/jp-list.json')
                        list = list.concat(list2)

                        umaMap = new Map(list.map(uma => [uma.id, uma]));
                        
                        type = "Multi"

                        initialPointsJP = 18 + 1
                        minusPointsJP = 6
                        initialBlur = 18 + 1
                    } else if ((args.length > 0) && (((args[0].length == 1) && (args[0].toLowerCase() == "s")) || ((args[0].length == 1) && (args[0].toLowerCase() == "p")) || (args[0].toLowerCase().includes("sample")) || (args[0].toLowerCase().includes("practice")))) {
                        list = require('../../src/assets/global-list.json')
                        list2 = require('../../src/assets/jp-list.json')
                        list = list.concat(list2)

                        const sampledUmas = new Set(data["sample"])
                        list = list.filter(uma => sampledUmas.has(uma.id))

                        type = "Sample"

                        initialPointsJP = 0
                        minusPointsJP = 0
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
                        } else if (data["type"] === 'm') {
                            list = require('../../src/assets/global-list.json')
                            list2 = require('../../src/assets/jp-list.json')
                            list = list.concat(list2)
                            type = "Multi"

                            umaMap = new Map(list.map(uma => [uma.id, uma]));

                            initialPointsJP = 18 + 1
                            minusPointsJP = 6
                            initialBlur = 18 + 1
                        } else if (data["type"] === 'p') {
                            list = require('../../src/assets/global-list.json')
                            list2 = require('../../src/assets/jp-list.json')
                            list = list.concat(list2)

                            const sampledUmas = new Set(data["sample"])
                            list = list.filter(uma => sampledUmas.has(uma.id))

                            type = "Sample"

                            initialPointsJP = 0
                            minusPointsJP = 0
                        } else { // Defaults to global if no args + no type set
                            list = require('../../src/assets/global-list.json')
                            type = "Global"

                            initialPointsJP = 15 + 1
                            minusPointsJP = 3
                        }
                    }

                var chooseChar
                var chooseImg
                var umaName
                var umaProper
                var umaNameArr

                var multiSet
                var nickArr
                var idArr
                var properArr

                try {
                    if (type == "Multi") { // handle multi case
                        cacheDir = path.join(__dirname, "../assets/multi_cache/")
                        originDir = path.join(__dirname, "../assets/multi/")
                        filterList = require('../../src/assets/filter-list.json')

                        const folderPath = path.join(__dirname, "../assets/multi/")
                        let files = fs.readdirSync(folderPath)

                        let filterEntry = filterList.find(f => f.id == "multi")?.images ?? [] // default to empty array if not found
                        let availImages

                        if ((client.filterCache.get(message.guild.id) == true) || (client.filterCache.get(message.guild.id) == undefined)) {
                            availImages = files.filter(image => !filterEntry.includes(image))
                        } else {
                            availImages = files
                        }

                        chooseChar = Math.floor(Math.random() * availImages.length)
                        // chooseChar = 77
                        chooseImg = availImages[chooseChar] // picks a random filename

                        umaNameArr = chooseImg.split("_") // create arr splitting across the '_'
                        umaNameArr.pop() // get rid of number and final _
                        multiSet = new Set(umaNameArr) // make set with given umas

                        properArr = umaNameArr.map(name => umaMap.get(name).proper)
                        nickArr = umaNameArr.map(name => umaMap.get(name).names)
                        idArr = umaNameArr.map(name => umaMap.get(name).number)

                        umaName = umaNameArr.join(', ')
                        umaProper = properArr.join(', ')
                    } else {
                        filterList = require('../../src/assets/filter-list.json')
                        chooseChar = Math.floor(Math.random() * list.length)
                        // chooseChar = 0

                        if (list.length == 0) {
                            var noSampleUmas = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `You have no umas in your practice list, ending game`
                                })
                                .setColor("LightGrey")

                            await message.channel.send({ embeds: [noSampleUmas] })
                            activeChannels.delete(channelID);
                            return;
                        }

                        let chooseCharObj = list[chooseChar] // finds the obj corresponding to the index (e.g. taikishuttle)
                        let filterEntry = filterList.find(f => f.id == chooseCharObj.id)?.images ?? [] // default to empty array if not found

                        if (type != "IRL" && ((client.filterCache.get(message.guild.id) == true) || (client.filterCache.get(message.guild.id) == undefined))) {
                            availImages = chooseCharObj['images'].filter(image => !filterEntry.includes(image))
                        } else { // for IRL/voice
                            availImages = chooseCharObj['images']
                        }

                        chooseImg = availImages[Math.floor(Math.random() * availImages.length)] // a filename

                        umaName = chooseCharObj['id']
                        umaProper = chooseCharObj['proper']
                    }
                } catch (err) {
                    await message.channel.send({ embeds: [errorEmbed] });

                    try {
                        if (logChannel) {
                            await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): <@${BigInt("236186510326628353")}> \`${data["username"]}\` had an error with ${chooseImg}. look into this plz`)
                        }
                    } catch (err) {
                        console.error("Log channel fetch/send error:", err);

                        activeChannels.delete(channelID)
                        return;
                    }
                    
                    activeChannels.delete(channelID)
                    return;
                }

                try {
                    if (logChannel) {
                        await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): \`${data["username"]}\` started a game with the correct answer being ${umaProper}`)
                    }
                } catch (err) {
                    console.error("Log channel fetch/send error:", err);

                    activeChannels.delete(channelID); // get rid of the game so they can play again
                    return;
                }

                console.log(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} started a game with the correct answer being ${umaProper}`)

                const countCollection = database.collection("count")

                if (type != "Multi") {
                    if (type != "Sample") {
                        await countCollection.updateOne(
                            { name: umaName },
                            { 
                                $inc: { count: 1, old_count: 1 },
                                $set: { proper: umaProper }
                            },
                            { upsert: true }
                        )
                    }
                } else {
                    const bulkOps = umaNameArr.map(u => ({
                        updateOne: {
                            filter: { name: u },
                            update: { $inc: { count: 1, old_count: 1 } }
                        }
                    }));

                    await countCollection.bulkWrite(bulkOps);
                }

                // const top = await countCollection.find().sort({ count: -1 }).limit(5).toArray() <- logic for determining top # umas chosen

                // so like, 51-image_name(num).jpg

                try {
                    if (type == "IRL") { // set special image directory for irl horse guessing
                        originDir = path.join(__dirname, "../assets/horses")

                        var imagePath = path.join(originDir, `${chooseImg}`); // check for existence
                        var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'blurred.jpg' });
                    } else if (type == "Voice") {
                        originDir = path.join(__dirname, "../assets/voices")

                        var imagePath = path.join(originDir, `${chooseImg}`); // check for existence
                        var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: '???.mp3' });
                    } else {
                        var imagePath = path.join(cacheDir, `${initialBlur}-${chooseImg}`); // check for existence
                        var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'blurred.jpg' });
                    }
                } catch (err) {
                    await message.channel.send({ embeds: [errorEmbed] });
                    console.error('Image file error:', err);
                    
                    activeChannels.delete(channelID); // get rid of the game so they can play again
                    return;
                }
                
                const hint = new ButtonBuilder()
                    .setCustomId('hint')
                    .setLabel('Hint')
                    .setStyle(ButtonStyle.Primary);

                const unblur = new ButtonBuilder()
                    .setCustomId('unblur')
                    .setLabel('Unblur')
                    .setStyle(ButtonStyle.Secondary);

                const skip = new ButtonBuilder()
                    .setCustomId('skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Danger);

                const playAgain = new ButtonBuilder()
                    .setCustomId('play_again')
                    .setLabel("Play Again")
                    .setStyle(ButtonStyle.Primary)

                const autoplayButton = new ButtonBuilder()
                    .setCustomId('autoplay')
                    .setLabel("Autoplay")
                    .setStyle(ButtonStyle.Success)

                const stopAutoplay = new ButtonBuilder()
                    .setCustomId('stop_autoplay')
                    .setLabel("Stop Autoplay")
                    .setStyle(ButtonStyle.Danger)

                if ((type != "IRL") && (type != "Voice")) {
                    var row = new ActionRowBuilder()
                        .addComponents(hint)
                        .addComponents(unblur)
                        .addComponents(skip)

                    var rowWithoutAutoplay = new ActionRowBuilder()
                        .addComponents(hint)
                        .addComponents(unblur)
                        .addComponents(skip)

                    if (autoplay) { // give option to stop autoplay
                        row.addComponents(stopAutoplay)
                    }
                }

                if (type == "IRL") {
                    var row = new ActionRowBuilder() // no unblur
                        .addComponents(skip)

                    var IRLWithoutAutoplay = new ActionRowBuilder()
                        .addComponents(skip)
                    
                    if (autoplay) { // give option to stop autoplay
                        row.addComponents(stopAutoplay)
                    }
                }

                if (initial) { // for initial games, give option for playing again or autoplay
                    var playAgainRow = new ActionRowBuilder()
                        .addComponents(playAgain)
                        .addComponents(autoplayButton)
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Guess the Uma`)
                    .setImage('attachment://blurred.jpg')
                    .setColor('LightGrey')

                embed.setDescription(`Started by ${user}\n\nType: ${type}`)

                if ((type != "IRL") && (type != "Voice")) {
                    var sentMsg = await message.channel.send({ embeds: [embed],  components: [row], files: [file] })
                } else if (type == "IRL") {
                    var sentMsg = await message.channel.send({ embeds: [embed], components: [row], files: [file] })
                } else {
                    var sentMsg = await message.channel.send({ embeds: [embed] })
                    await message.channel.send({ files: [file] })
                }

                // const filter = (i) => i.user.id === message.author.id

                const collector = sentMsg.createMessageComponentCollector({
                    componentType: ComponentType.Button,
                    time: 60_000
                });

                const messageCollector = sentMsg.channel.createMessageCollector({
                    time: 60_000
                });
                
                if (type != "Multi") {
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
                } else {
                    gameState.set(sentMsg.id, { // multi gameState
                        blurLevel: initialBlur,
                        imageName: chooseImg,
                        values: nickArr,
                        ids: idArr,
                        proper: properArr,
                        points: initialPointsJP,
                        hintsUsed: 0,
                        startTime: Date.now(),
                        multiSet: multiSet,
                        multiSetSize: multiSet.size, // bad naming, but the initial number of chars in the image
                        users: new Map(), // this holds user ids -> usernames
                        pointsGathered: new Map(), // this holds user ids -> points per use
                        processing: false // lock to prevent race condition; players answering at the same time
                    }) 
                }

                // No hint button interaction for horses or voice, so this will be skipped

                collector.on('collect', async (interaction) => { // Everytime a button is pressed on the embed
                try {
                    await interaction.deferUpdate();
                    
                        if (interaction.customId === 'hint') {
                            let state = gameState.get(sentMsg.id);
                            if (!state) return;

                            if (state.blurLevel >= 11) { // decrease hint level and blur level upon hint press, and only if the blur level is >= 11
                                let newBlurLevel

                                if (type == "Multi") {
                                    newBlurLevel = state.blurLevel - 4
                                } else {
                                    newBlurLevel = state.blurLevel - 10
                                }

                                let newHintsUsed = state.hintsUsed + 1
                                let newPoints

                                if (type == "Sample") {
                                    newPoints = 0
                                } else {
                                    newPoints = Math.max(1, state.points - minusPointsJP)
                                }

                                gameState.set(sentMsg.id, {
                                    ...state,
                                    blurLevel: newBlurLevel,
                                    hintsUsed: newHintsUsed,
                                    points: newPoints
                                })
                            }

                            state = gameState.get(sentMsg.id);

                            if ((state.blurLevel == 1) || (state.blurLevel == 7)) { // if all hints have been used, immediately goes here if revealed

                                try {
                                    var imagePath = path.join(originDir, `${chooseImg}`); // fallback to default image
                                    var newFile = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'original.jpg' })
                                } catch (err) {
                                    await message.channel.send({ embeds: [errorEmbed] });
                                    console.error('Image file error:', err);

                                    gameState.delete(sentMsg.id);
                                    activeChannels.delete(channelID);
                                    return;
                                }

                                const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                    .setImage('attachment://original.jpg')

                                if (toStopAutoplay) {
                                    await interaction.editReply({
                                        files: [newFile], embeds: [updatedEmbed], components: [rowWithoutAutoplay]
                                    });
                                } else {
                                    await interaction.editReply({
                                        files: [newFile], embeds: [updatedEmbed], components: [row]
                                    });
                                }

                            } else { // Do image operations for going down a hint level
                                try {
                                    var newPath = path.join(cacheDir, `${state.blurLevel}-${state.imageName}`);
                                    var newFile = new AttachmentBuilder(fs.readFileSync(newPath), { name: 'blurred.jpg' });
                                } catch (err) {
                                    await message.channel.send({ embeds: [errorEmbed] });
                                    console.error('Image file error:', err);

                                    gameState.delete(sentMsg.id);
                                    activeChannels.delete(channelID);
                                    return;
                                }

                                const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                    .setImage('attachment://blurred.jpg')

                                if (toStopAutoplay) {
                                    await interaction.editReply({
                                        files: [newFile], embeds: [updatedEmbed], components: [rowWithoutAutoplay]
                                    });
                                } else {
                                    await interaction.editReply({
                                        files: [newFile], embeds: [updatedEmbed], components: [row]
                                    });
                                }
                            }
                        } else if (interaction.customId === 'unblur') {
                            if (interaction.user.id !== user.id) {
                                await interaction.followUp({ content: "Only the game starter can fully unblur!", flags: 64 });
                                return
                            }

                            let state = gameState.get(sentMsg.id);
                            if (!state) return;

                            let newBlurLevel = 1
                            let newHintsUsed
                            let newPoints

                            if (type == "Sample") {
                                newPoints = 0
                            } else {
                                newPoints = 1
                            }

                            if (type == "Multi") {
                                newHintsUsed = 3
                            } else {
                                newHintsUsed = 5
                            }

                            gameState.set(sentMsg.id, {
                                ...state,
                                blurLevel: newBlurLevel,
                                hintsUsed: newHintsUsed,
                                points: newPoints
                            })

                            state = gameState.get(sentMsg.id);

                            try {
                                var imagePath = path.join(originDir, `${chooseImg}`); // fallback to default image
                                var newFile = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'original.jpg' })
                            } catch (err) {
                                await message.channel.send({ embeds: [errorEmbed] });
                                console.error('Image file error:', err);

                                gameState.delete(sentMsg.id);
                                activeChannels.delete(channelID);
                                return;
                            }

                            const updatedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                .setImage('attachment://original.jpg')

                            
                            if (toStopAutoplay) {
                                await interaction.editReply({
                                    files: [newFile], embeds: [updatedEmbed], components: [rowWithoutAutoplay]
                                });
                            } else {
                                await interaction.editReply({
                                    files: [newFile], embeds: [updatedEmbed], components: [row]
                                });
                            }
                            
                        } else if (interaction.customId === 'skip') {
                            if (interaction.user.id !== user.id) {
                                await interaction.followUp({ content: "Only the game starter can skip!", flags: 64 });
                                return
                            }

                            const state = gameState.get(sentMsg.id);
                            if (!state) return

                            messageCollector.stop()
                            collector.stop()

                            try {
                                if (logChannel && cmdLogChannel) {
                                    await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): \`${data["username"]}\` - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Skipped with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points`)
                                    await cmdLogChannel.send(`\`${data["username"]}\`: !skip`)
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

                            if ((type != "Multi") && (type != "Sample")) {
                                await ids.updateOne({ discord_id: discordID }, { // Remove streak if author skipped
                                    $set: {
                                        streak: 0,
                                }
                                });
                            }

                            try {
                                var imagePath = path.join(originDir, `${chooseImg}`);
                                var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'skipped.jpg' })
                            } catch (err) {
                                await message.channel.send({ embeds: [errorEmbed] });
                                console.error('Image file error:', err);

                                gameState.delete(sentMsg.id);
                                activeChannels.delete(channelID);
                                return;
                            }

                            let skippedEmbed

                            if (type != "Multi") {
                                skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                    .setImage('attachment://skipped.jpg')
                                    .setFooter({ text: `Skipped! The correct answer was ${state.proper}` });

                                let skippedMsgEmbed = new EmbedBuilder()
                                    .setTitle("\n")
                                    .addFields({
                                        name: "\n",
                                        value: `Skipped, the answer was **${state.proper}**`
                                    })
                                    .setColor('LightGrey')

                                await sentMsg.channel.send({ embeds: [skippedMsgEmbed] });
                            } else {
                                skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                    .setImage('attachment://skipped.jpg')
                                    .setFooter({ text: `Skipped! The correct answer was ${umaProper}` });

                                let skippedMsgEmbed = new EmbedBuilder()
                                    .setTitle("\n")
                                    .addFields({
                                        name: "\n",
                                        value: `Skipped, the answer was **${umaProper}**`
                                    })
                                    .setColor('LightGrey')

                                await sentMsg.channel.send({ embeds: [skippedMsgEmbed] });

                                if (state.multiSetSize != state.multiSet.size) { // At least something was guessed, send point summary
                                    let buildMessage = ""

                                    for (const [userId, points] of state.pointsGathered.entries()) {
                                        buildMessage += `<@${userId}> +${points} points\n`
                                    }

                                    var summaryEmbed = new EmbedBuilder()
                                        .setTitle("\n")
                                        .addFields({
                                            name: "\n",
                                            value: `**Points earned:**\n${buildMessage}`
                                        })
                                        .setColor('LightGrey')

                                    await sentMsg.channel.send({ embeds: [summaryEmbed] });
                                }
                                }

                                if (type == "Voice") {
                                    await interaction.editReply({
                                        embeds: [skippedEmbed],
                                        files: [],
                                        components: []
                                    });
                                } else {
                                    await interaction.editReply({
                                        embeds: [skippedEmbed],
                                        files: [file],
                                        components: []
                                    });
                                }

                                if ((!initial) && (!toStopAutoplay) && (autoplay)) {
                                    console.log(`Autoplay continuing... started by ${buttonUser.tag}`)
                                    await startGame(message, client, args, buttonUser, false, true)
                                }

                                return
                        } else if (interaction.customId === 'stop_autoplay') {
                            if (interaction.user.id !== user.id) {
                                await interaction.followUp({ content: "Only the game starter can stop the autoplay!", flags: 64 });

                                return
                            }

                            if (!toStopAutoplay) {
                                if (type != "IRL") {
                                    await interaction.editReply({ // remove stop autoplay button
                                        components: [rowWithoutAutoplay]
                                    });
                                } else {
                                    await interaction.editReply({ // remove stop autoplay button
                                        components: [IRLWithoutAutoplay]
                                    });
                                }

                                await sentMsg.channel.send({ embeds: [autoPlayStoppedEmbed] });
                                console.log(`Autoplay stopped by ${buttonUser.tag}`)
                                toStopAutoplay = true
                            }

                            return
                        }
                } catch (err) {
                    console.log("Collection error: ", err)

                    gameState.delete(sentMsg.id);
                    activeChannels.delete(channelID);
                    return;
                }
                })

                // timer reminders

                setTimeout(() => {
                    if (gameState.has(sentMsg.id)) {
                        sentMsg.channel.send({ embeds: [reminder30] });
                    }
                }, 30_000);

                setTimeout(() => {
                    if (gameState.has(sentMsg.id)) {
                        sentMsg.channel.send({ embeds: [reminder10] });
                    }
                }, 50_000);

                messageCollector.on('collect', async (msg) => { // Collect guesses
                    const state = gameState.get(sentMsg.id);
                    if (!state) return;

                    const originGuess = msg.content
                    const userGuess = originGuess.trim().toLowerCase().replace(/\s+/g, '')
                    const strictGuess = originGuess.toLowerCase()

                    if (((userGuess === '!skip') || (userGuess === '!s') || (userGuess === '$skip') || (userGuess === '$s') || (userGuess === 'skip')) && (msg.author.id === user.id)) { // Skipped. Note that to skip, you have to be the author of the message
                        messageCollector.stop()
                        collector.stop()

                        try {
                            if (logChannel && cmdLogChannel) {
                                await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): \`${data["username"]}\` - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Skipped with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points`)
                                await cmdLogChannel.send(`\`${data["username"]}\`: !skip`)
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

                        if ((type != "Multi") && (type != "Sample")) {
                            await ids.updateOne({ discord_id: discordID }, { // Remove streak if author skipped
                                $set: {
                                    streak: 0,
                            }
                            });
                        }

                        try {
                            var imagePath = path.join(originDir, `${chooseImg}`);
                            var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'skipped.jpg' })
                        } catch (err) {
                            await message.channel.send({ embeds: [errorEmbed] });
                            console.error('Image file error:', err);

                            gameState.delete(sentMsg.id);
                            activeChannels.delete(channelID);
                            return;
                        }

                        let skippedEmbed

                        if (type != "Multi") {
                            skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                .setImage('attachment://skipped.jpg')
                                .setFooter({ text: `Skipped! The correct answer was ${state.proper}` });

                            var skippedMsgEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `Skipped, the answer was **${state.proper}**`
                                })
                                .setColor('LightGrey')

                            await sentMsg.channel.send({ embeds: [skippedMsgEmbed] });
                        } else {
                            skippedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                .setImage('attachment://skipped.jpg')
                                .setFooter({ text: `Skipped! The correct answer was ${umaProper}` });

                            var skippedMsgEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `Skipped, the answer was **${umaProper}**`
                                })
                                .setColor('LightGrey')

                            await sentMsg.channel.send({ embeds: [skippedMsgEmbed] });

                            if (state.multiSetSize != state.multiSet.size) { // At least something was guessed, send point summary
                            let buildMessage = ""

                            for (const [userId, points] of state.pointsGathered.entries()) {
                                buildMessage += `<@${userId}> +${points} points\n`
                            }

                            var summaryEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `**Points earned:**\n${buildMessage}`
                                })
                                .setColor('LightGrey')

                            await message.channel.send({ embeds: [summaryEmbed] });    
                        }
                        }

                        if (type == "Voice") {
                            await sentMsg.edit({
                                embeds: [skippedEmbed],
                                files: [],
                                components: []
                            });
                        } else {
                            await sentMsg.edit({
                                embeds: [skippedEmbed],
                                files: [file],
                                components: []
                            });
                        }

                        if ((!initial) && (!toStopAutoplay) && (autoplay)) {
                            console.log(`Autoplay continuing... started by ${buttonUser.tag}`)
                            await startGame(message, client, args, buttonUser, false, true)
                        }

                        return
                    }

                    if (type != "Multi") { // every other gamemode except Multi
                    
                        if ((((client.strictCache.get(BigInt(msg.author.id)) == false) || // checker for non-strict
                            (client.strictCache.get(BigInt(msg.author.id)) == undefined)) &&
                            (state.values.includes(userGuess))) ||
                                ((client.strictCache.get(BigInt(msg.author.id)) == true) && // checker for strict
                                (state.proper.toLowerCase() == strictGuess))) {
                            // Got it right
                            messageCollector.stop()
                            collector.stop()

                            let timeAnswered = Date.now() - state.startTime
                            let favPoints = 0

                            const countCollection = database.collection("count")

                            if (type != "Sample") {
                                await countCollection.updateOne(
                                    { name: umaName },
                                    { 
                                        $inc: { wins: 1 },
                                        $set: { proper: umaProper }
                                    },
                                    { upsert: true }
                                )
                            }

                            var authorID = BigInt(msg.author.id); // ID of the person who got it right

                            if (client.restrictedUsers.get(BigInt(msg.author.id)) == true) { // set answerer's points to 1 if they're restricted
                                state.points = 0
                            }

                            count = await ids.countDocuments({ discord_id: authorID });
                            if (count < 1) await setup.init(authorID, "uma", "profiles", client); // Make document in case

                            let addGuild = { // add their id to the guilds arr in case
                                $addToSet: {
                                    guilds: BigInt(msg.guild.id)
                                }
                            }

                            await ids.updateOne({ discord_id: authorID }, addGuild )

                            var broadSearch = await ids.findOne({ discord_id: authorID })

                            try {
                                if (logChannel) {
                                    await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): \`${data["username"]}\` - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Answered by ${broadSearch["username"]} with "${originGuess}". ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, ${state.points}/${initialPointsJP} points`)
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

                            let voteTimer = broadSearch['vote_timer']

                            if (voteTimer + 300_000 > Date.now()) { // Checks for multiplier
                                state.points = Math.floor(state.points * 1.5);
                            }

                            let topStreak = broadSearch["top_streak"]
                            let newStreak = broadSearch["streak"] + 1
                            
                            let topTime = broadSearch["quickest_answer"]
                            let newQuickest;

                            let addWins = 1

                            if (topTime == 0) { // If someone has a quickest answer of 0s, which shouldn't be possible (aka new users)
                                newQuickest = timeAnswered
                            } else {
                                newQuickest = Math.min(timeAnswered, topTime)
                            }

                            if (broadSearch['favorites'].includes(umaName)) { // If they got it right and it's their fav set
                                if (type != "Sample") {
                                    favPoints += 15
                                    await msg.channel.send( {embeds: [favEmbed]} )
                                } else {
                                    await msg.channel.send( {embeds: [sampleEmbed]} )
                                }
                            }

                            // Initial message sender is discordID
                            // Answerer is authorID

                            if (authorID == discordID) { // Increment streak of the answerer by one
                                if (client.restrictedUsers.get(authorID) == true) { // don't add new streak or time
                                    addWins = 0
                                } else { // not restricted and not playing sample
                                    if (type != "Sample") {
                                        await ids.updateOne({ discord_id: discordID }, {
                                            $set: {
                                                top_streak: Math.max(newStreak, topStreak),
                                                quickest_answer: newQuickest
                                            },
                                            $inc: {
                                                streak: 1,
                                            }
                                        });
                                    } else {
                                        addWins = 0
                                    }
                                }
                            } else { // someone else answered that's not the initial message sender, goodbye streak
                                if (client.restrictedUsers.get(authorID) == true) {
                                    addWins = 0
                                } else {
                                    if (type != "Sample") {
                                        await ids.updateOne({ discord_id: authorID }, {
                                            $set: {
                                                top_streak: Math.max(newStreak, topStreak),
                                                quickest_answer: newQuickest
                                            },
                                            $inc: {
                                                streak: 1,
                                            }
                                        });
                                    } else {
                                        addWins = 0
                                    }
                                }
                            }

                            const addPoints = {
                                $inc: {
                                    points: state.points + favPoints,
                                    points_today: state.points + favPoints,
                                    points_weekly: state.points + favPoints,
                                    points_monthly: state.points + favPoints,

                                    wins: addWins,
                                    wins_today: addWins,
                                    wins_weekly: addWins,
                                    wins_monthly: addWins
                                }
                            }

                            if (type != "Sample") addPoints.$push = { times: timeAnswered };

                            // rank up message
                            const oldPoints = broadSearch['points']
                            const newPoints = broadSearch['points'] + state.points + favPoints;

                            let {prevRankSymbol, rankSymbol} = returnRankedMessage(oldPoints, newPoints)

                            if (prevRankSymbol && rankSymbol != null) {
                                let rankUpEmbed = new EmbedBuilder()
                                    .setTitle("\n")
                                    .addFields({
                                        name: "\n",
                                        value: `**Rank Up!!** <@${authorID}>, you've reached a new rank: ${prevRankSymbol} **->** ${rankSymbol}`
                                    })
                                    .setColor('LightGrey')

                                await message.channel.send({ embeds: [rankUpEmbed] });
                            }

                            await ids.updateOne({ discord_id: authorID }, addPoints); // update happens, i don't wanna do another findOne so we'll add the points dynamically

                            var pointCount = broadSearch["points"] + state.points + favPoints
                            var winCount = broadSearch["wins"] + (type != "Sample" ? 1 : 0)
                            var dailyPointCount = broadSearch["points_today"] + state.points + favPoints
                            var dailyWinCount = broadSearch["wins_today"] + (type != "Sample" ? 1 : 0)
                            var streakCount = broadSearch["streak"] + (type != "Sample" ? 1 : 0)

                            var correctEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `Correct <@${authorID}>! The answer was **${state.proper}** *(+${state.points + favPoints} points)*\n\nYour total points: **${pointCount}** *(${dailyPointCount} today)*\nYour total correct guesses: **${winCount}** *(${dailyWinCount} today)*\n\nCurrent Streak: **${streakCount}**`
                                })
                                .setColor('LightGrey')

                            let playAgainMsg

                            if (initial) {
                                playAgainMsg = await message.channel.send({ embeds: [correctEmbed], components: [playAgainRow] })
                            } else {
                                playAgainMsg = await message.channel.send({ embeds: [correctEmbed] })
                            }

                            if (((newQuickest < topTime) || (topTime == 0)) && (type != "Sample")) { // send special message for new quickest time
                                let fastestEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `You have a new fastest answer time of **${(newQuickest / 1000).toFixed(2)}** sec!`
                                })
                                .setColor('LightGrey')

                                await msg.channel.send({ embeds: [fastestEmbed] });
                            }
                            
                            try {
                                var imagePath = path.join(originDir, `${chooseImg}`);
                                var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'revealed.jpg' })

                                if (type == "Voice") {
                                    var imagePath = path.join(originDir, `${chooseImg}`);
                                    var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'revealed.mp3' })
                                }
                            } catch (err) {
                                await message.channel.send({ embeds: [errorEmbed] });
                                console.error('Image file error:', err);

                                gameState.delete(sentMsg.id);
                                activeChannels.delete(channelID);
                                return;
                            }

                            const revealedEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                .setImage('attachment://revealed.jpg')
                                .setFooter({ text: `Guessed by ${msg.author.username} in ${(timeAnswered / 1000).toFixed(2)}s | Used ${state.hintsUsed} hints` });

                            if (type == "IRL") {
                                revealedEmbed.setFooter({ text: `Guessed by ${msg.author.username} in ${(timeAnswered / 1000).toFixed(2)}s` });
                            }

                            if (type == "Voice") {
                                await sentMsg.edit({
                                    embeds: [revealedEmbed],
                                    files: [],
                                    components: []
                                });
                            } else {
                                await sentMsg.edit({
                                    embeds: [revealedEmbed],
                                    files: [file],
                                    components: []
                                });
                            }

                            const playAgainCollector = playAgainMsg.createMessageComponentCollector({
                                componentType: ComponentType.Button,
                                time: 20_000
                            });

                            playAgainCollector.on('collect', async (interaction) => { // When the play again button is hit
                                await interaction.deferUpdate();
                                playAgainCollector.stop()

                                try {                                
                                    if (interaction.customId === 'play_again') {
                                        playAgainCollector.stop()

                                        await playAgainMsg.edit({
                                            embeds: [correctEmbed],
                                            components: []
                                        })

                                        console.log(`Play again button hit by ${interaction.user.tag}, starting new ${type} game...`)
                                        await startGame(message, client, args, interaction.user, true, false)
                                    } else if (interaction.customId === 'autoplay') {
                                        playAgainCollector.stop()

                                        await playAgainMsg.edit({
                                            embeds: [correctEmbed],
                                            components: []
                                        })

                                        console.log(`Autoplay started by ${interaction.user.tag}, starting new ${type} game...`)
                                        await startGame(message, client, args, interaction.user, false, true)
                                    }
                                } catch (err) {
                                    playAgainCollector.stop()
                                    console.log("Play again collection error: ", err)
                                }
                            })

                            playAgainCollector.on('end', async (collected, reason) => {
                                if (reason === 'time') {
                                    await playAgainMsg.edit({
                                        embeds: [correctEmbed],
                                        components: []
                                    })
                                }
                            })

                            if ((!initial) && (!toStopAutoplay) && (autoplay)) {
                                console.log(`Autoplay continuing... started by ${buttonUser.tag}`)
                                await startGame(message, client, args, buttonUser, false, true)
                            }
                        }
                    } else { // Run this for multi games, got it right
                        const foundItem = client.strictCache.get(BigInt(msg.author.id)) === true 
                            ? list.find(items => items.proper.toLowerCase() === strictGuess)
                            : list.find(items => items.names.includes(userGuess));

                        if (foundItem && state.multiSet.has(foundItem.id)) {
                            // Got it right
                            while (state.processing) { // continuously check if we're processing a previous correct guess
                                await new Promise(resolve => setTimeout(resolve, 10))
                            }

                            state.processing = true // set true for processing current guess

                            let umaName = list.find((items) => items.names.includes(userGuess)).id
                            let umaProper = list.find(items => items.id == umaName).proper

                            if (!umaName || !umaProper) {
                                console.log(umaName)
                                console.log(umaProper)

                                gameState.delete(sentMsg.id);
                                activeChannels.delete(channelID);

                                console.log("something went wrong here!")

                                state.processing = false;
                                return;
                            }

                            state.multiSet.delete(umaName) // get rid of it from the set so it can't be guessed anymore

                            if (state.multiSet.size == 0) { // if it was the last one, found em all, stop collectors and clean up channels
                                messageCollector.stop()
                                collector.stop()
                                gameState.delete(sentMsg.id)
                                activeChannels.delete(channelID)
                            }

                            var authorID = BigInt(msg.author.id); // ID of the person who got it right

                            count = await ids.countDocuments({ discord_id: authorID });
                            if (count < 1) await setup.init(authorID, "uma", "profiles", client); // Make document in case

                            let addGuild = { // add their id to the guilds arr in case
                                $addToSet: {
                                    guilds: BigInt(msg.guild.id)
                                }
                            }

                            await ids.updateOne({ discord_id: authorID }, addGuild )

                            var broadSearch = await ids.findOne({ discord_id: authorID }) // find their profile to begin updates

                            var voteTimer = broadSearch['vote_timer']
                            let favPoints = 0
                            let addCorrectPoints = state.points
                            let addWins = 1

                            if (voteTimer + 300_000 > Date.now()) { // Checks for multiplier
                                addCorrectPoints = Math.floor(addCorrectPoints * 1.5);
                            }

                            if (broadSearch['favorites'].includes(umaName)) {
                                if (type != "Sample") {
                                    favPoints += 15
                                    await msg.channel.send( {embeds: [favEmbed]} )
                                } else {
                                    await msg.channel.send( {embeds: [sampleEmbed]} )
                                }
                            }

                            addCorrectPoints += favPoints

                            state.users.set(msg.author.id, msg.author.username)
                            state.pointsGathered.set(msg.author.id, (state.pointsGathered.get(msg.author.id) ?? 0) + addCorrectPoints)

                            if (client.restrictedUsers.get(BigInt(msg.author.id)) == true) { // set answerer's points to 0 if they're restricted
                                state.pointsGathered.set(msg.author.id, 0) // set back to 0 for restricted folk
                                addWins = 0
                                addCorrectPoints = 0
                                favPoints = 0
                            }

                            let timeAnswered = Date.now() - state.startTime
                            
                            const countCollection = database.collection("count")

                            await countCollection.updateOne(
                                { name: umaName },
                                { $inc: { wins: 1 } }
                            );

                            try {
                                if (logChannel) {
                                    await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): \`${data["username"]}\` - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Answered a multi uma by ${broadSearch["username"]} with "${originGuess}". ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, ${addCorrectPoints}/${initialPointsJP} points`)
                                }
                            } catch (err) {
                                console.error("Log channel fetch/send error:", err);

                                gameState.delete(sentMsg.id);
                                activeChannels.delete(channelID);
                                return;
                            }

                            console.log(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): ${data["username"]} - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - Answered a multi uma by ${broadSearch["username"]} with "${originGuess}". ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, ${addCorrectPoints}/${initialPointsJP} points`)

                            // Initial message sender is discordID
                            // Answerer is authorID

                            const addPoints = {
                                $inc: {
                                    points: addCorrectPoints,
                                    points_today: addCorrectPoints,
                                    points_weekly: addCorrectPoints,
                                    points_monthly: addCorrectPoints,
                                    
                                    wins: addWins,
                                    wins_today: addWins,
                                    wins_weekly: addWins,
                                    wins_monthly: addWins
                                } /*, temporarily pause
                                $push: {
                                    times: timeAnswered,
                                }*/
                            }

                            // rank up message
                            const oldPoints = broadSearch['points'];
                            const newPoints = broadSearch['points'] + addCorrectPoints

                            let {prevRankSymbol, rankSymbol} = returnRankedMessage(oldPoints, newPoints)

                            if (prevRankSymbol && rankSymbol != null) {
                                let rankUpEmbed = new EmbedBuilder()
                                    .setTitle("\n")
                                    .addFields({
                                        name: "\n",
                                        value: `**Rank Up!!** <@${authorID}>, you've reached a new rank: ${prevRankSymbol} **->** ${rankSymbol}`
                                    })
                                    .setColor('LightGrey')

                                await message.channel.send({ embeds: [rankUpEmbed] });
                            }

                            await ids.updateOne({ discord_id: authorID }, addPoints); // update happens, i don't wanna do another findOne so we'll add the points dynamically

                            var pointCount = broadSearch["points"] + addCorrectPoints
                            var winCount = broadSearch["wins"] + 1
                            var dailyPointCount = broadSearch["points_today"] + addCorrectPoints
                            var dailyWinCount = broadSearch["wins_today"] + 1
                            // temporarily paused: var streakCount = broadSearch["streak"] + 1
                            
                            try {
                                var imagePath = path.join(originDir, `${chooseImg}`);
                                var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'revealed.jpg' })
                            } catch (err) {
                                await message.channel.send({ embeds: [errorEmbed] });
                                console.error('Image file error:', err);

                                gameState.delete(sentMsg.id);
                                activeChannels.delete(channelID);
                                state.processing = false
                                return;
                            }

                            var correctMultiEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `Correct <@${authorID}>! (${state.multiSetSize - state.multiSet.size}/${state.multiSetSize}) ${"✅ ".repeat(state.multiSetSize - state.multiSet.size)}${"<:white_large_square_X:1432246056187334746> ".repeat(state.multiSet.size)}`
                                })
                                .setColor('LightGrey')
                            
                            await msg.channel.send({ embeds: [correctMultiEmbed] })

                            if (state.multiSet.size == 0) { // create summary message at the end
                                let buildMessage = ""

                                for (const [userId, points] of state.pointsGathered.entries()) {
                                    buildMessage += `<@${userId}> +${points} points\n`
                                }

                                var summaryEmbed = new EmbedBuilder()
                                    .setTitle("\n")
                                    .addFields({
                                        name: "\n",
                                        value: `Congratulations, you guessed all the umas in the picture!\n\n**Points earned:**\n${buildMessage}`
                                    })
                                    .setColor('LightGrey')

                                let playAgainMsg
                                
                                if (initial) {
                                    playAgainMsg = await msg.channel.send({ embeds: [summaryEmbed], components: [playAgainRow] })
                                } else {
                                    playAgainMsg = await msg.channel.send({ embeds: [summaryEmbed] })
                                }
                                
                                var revealedEmbed = EmbedBuilder.from(sentMsg.embeds)
                                    .setImage("attachment://revealed.jpg")
                                    .setFooter({
                                    text: `Guessed by ${Array.from(state.users.values()).join(", ")} in ${(timeAnswered / 1000).toFixed(2)}s | Used ${state.hintsUsed} hints`,
                                    })
                                
                                await sentMsg.edit({
                                    embeds: [revealedEmbed],
                                    files: [file],
                                    components: [],
                                })

                                const playAgainCollector = playAgainMsg.createMessageComponentCollector({
                                    componentType: ComponentType.Button,
                                    time: 20_000
                                });

                                playAgainCollector.on('collect', async (interaction) => { // When the play again button is hit
                                    await interaction.deferUpdate();
                                    playAgainCollector.stop()

                                    try {                                
                                        if (interaction.customId === 'play_again') {
                                            playAgainCollector.stop()

                                            await playAgainMsg.edit({
                                                embeds: [summaryEmbed],
                                                components: []
                                            })

                                            console.log(`Play again button hit by ${interaction.user.tag}, starting new ${type} game...`)
                                            await startGame(message, client, args, interaction.user, true, false)
                                        } else if (interaction.customId === 'autoplay') {
                                            playAgainCollector.stop()

                                            await playAgainMsg.edit({
                                                embeds: [summaryEmbed],
                                                components: []
                                            })

                                            console.log(`Autoplay started by ${interaction.user.tag}, starting new ${type} game...`)
                                            await startGame(message, client, args, interaction.user, false, true)
                                        }
                                    } catch (err) {
                                        playAgainCollector.stop()
                                        console.log("Play again collection error: ", err)
                                    }
                                })

                                playAgainCollector.on('end', async (collected, reason) => {
                                    if (reason === 'time') {
                                        await playAgainMsg.edit({
                                            embeds: [summaryEmbed],
                                            components: []
                                        })
                                    }
                                })

                                if ((!initial) && (!toStopAutoplay) && (autoplay)) {
                                    console.log(`Autoplay continuing... started by ${buttonUser.tag}`)
                                    await startGame(message, client, args, buttonUser, false, true)
                                }
                            }
                                
                            state.processing = false // release at the end
                        }
                    }
                })

                messageCollector.on('end', async (collected, reason) => { // No one got it right. Again, the command sender should have a registered entry so this should work
                    if (reason === 'time') { // Also reset the streak of the user who sent it
                        const state = gameState.get(sentMsg.id);
                        if (!state) return;

                        try {
                            if (logChannel) {
                                await logChannel.send(`(${d.toLocaleString("en-US", { timeZone: "Pacific/Honolulu", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true } )}): \`${data["username"]}\` - ${umaProper} (${type}/${data["type"]}/${args[0] ?? 'no args'}) - No one answered, with ${state.hintsUsed} hints, ${(Date.now() - state.startTime) / 1000} sec, 0/${initialPointsJP} points`)
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

                            if (type == "Voice") {
                                var imagePath = path.join(originDir, `${chooseImg}`);
                                var file = new AttachmentBuilder(fs.readFileSync(imagePath), { name: 'timeout.mp3' })
                            }
                        } catch (err) {
                            await message.channel.send({ embeds: [errorEmbed] });
                            console.error('Image file error:', err);

                            gameState.delete(sentMsg.id);
                            activeChannels.delete(channelID);
                            return;
                        }

                        let timeoutEmbed

                        if (type != "Multi") {
                            timeoutEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                                .setImage('attachment://timeout.jpg')
                                .setFooter({ text: `Time's up! The correct answer was ${state.proper}` });

                            let timesUpEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `Nobody got it right. The answer was **${state.proper}**`
                                })
                                .setColor('LightGrey')

                            await sentMsg.channel.send({ embeds: [timesUpEmbed] });
                        } else {
                            timeoutEmbed = EmbedBuilder.from(sentMsg.embeds[0])
                            .setImage('attachment://timeout.jpg')
                            .setFooter({ text: `Time's up! The correct answer was ${umaProper}` });

                            if (state.multiSetSize != state.multiSet.size) { // At least something was guessed, send point summary
                                let buildMessage = ""

                                for (const [userId, points] of state.pointsGathered.entries()) {
                                    buildMessage += `<@${userId}> +${points} points\n`
                                }

                                var summaryEmbed = new EmbedBuilder()
                                    .setTitle("\n")
                                    .addFields({
                                        name: "\n",
                                        value: `**Points earned:**\n${buildMessage}`
                                    })
                                    .setColor('LightGrey')

                                await message.channel.send({ embeds: [summaryEmbed] });
                            } else {
                                var noneEmbed = new EmbedBuilder()
                                .setTitle("\n")
                                .addFields({
                                    name: "\n",
                                    value: `Nobody got it right. The answer was **${umaProper}**`
                                })
                                .setColor('LightGrey')

                                await sentMsg.channel.send({ embeds: [noneEmbed] });
                            }
                        }

                        if (type == "Voice") {
                            await sentMsg.edit({
                                embeds: [timeoutEmbed],
                                files: [],
                                components: []
                            });
                        } else {
                            await sentMsg.edit({
                                embeds: [timeoutEmbed],
                                files: [file],
                                components: []
                            });
                        }

                        gameState.delete(sentMsg.id);
                        activeChannels.delete(channelID);

                        if ((type != "Multi") && (type != "Sample")) {
                            await ids.updateOne({ discord_id: discordID }, { // Remove streak if author skipped
                                $set: {
                                    streak: 0,
                            }
                            });
                        }

                    }
                })

            } catch (error) { // Catch errors in the initial block
            const msg = error?.rawError?.message || error?.message || String(error);
            console.error("Main !uma error, gameState and activeChannels cleaned up:", msg);

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
    }
};

module.exports.gameState = gameState
module.exports.activeChannels = activeChannels
