const { SlashCommandBuilder } = require('discord.js');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const charSheet = require('../../src/assets/characters.json')
const emoteSheet = require('../../src/assets/emotes.json')
const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

// const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Returns information about your profile'),

    run: ({ interaction }) => {
             
        (async () => { // run, and if an error occurs, you can catch it

            await interaction.deferReply();

            try {
                const client = new MongoClient(uri)

                const database = client.db("registration");
                const ids = database.collection("ids")
                var discordID = BigInt(interaction.user.id)

                const counter = await ids.countDocuments({discord_id: discordID})

                if (counter >= 1) {

                    const options = {
                        projection: {
                            _id: 0,
                            hsr_id: 1
                        }
                    }

                    const toParseUserUID = await ids.findOne({discord_id: discordID}, options);
                    const userUID = toParseUserUID['hsr_id']
                    // await client.close()
                    
                    const res = await fetch("https://api.mihomo.me/sr_info/" + userUID + "?lang=en");
                    if (res.ok) {
                        const data = await res.json();

                        // console.log(data, { depth: null }) // .dir for full

                        var suppChar = String(data?.["detailInfo"]?.['assistAvatarDetail']?.["avatarId"]);

                        var showOne = String(data?.["detailInfo"]?.['avatarDetailList']?.[0]?.["avatarId"])
                        var showTwo = String(data?.["detailInfo"]?.['avatarDetailList']?.[1]?.["avatarId"]);
                        var showThree = String(data?.["detailInfo"]?.['avatarDetailList']?.[2]?.["avatarId"]);

                        var signature = String(data?.["detailInfo"]?.["signature"]);

                        var worldLevel = String(data?.["detailInfo"]?.['worldLevel']);

                        var supportCheck = "0";
                        var showcaseCheck = "000";

                        var signatureCheck = "0";
                        
                        var worldLevelCheck = "0"; // 1 is the default for world level no matter what i believe

                        if (suppChar !== "undefined") {
                            //console.log("has supp")
                            supportCheck = "1";
                        } else {
                            console.log("no supp")
                        }

                        if ((showOne === "undefined") && (showTwo === "undefined") && (showThree === "undefined")) {
                            console.log("000")
                            showcaseCheck = "0";
                        } else if ((showOne !== "undefined") && (showTwo === "undefined") && (showThree === "undefined")) {
                            //console.log("100")
                            showcaseCheck = "1"
                        } else if ((showOne !== "undefined") && (showTwo !== "undefined") && (showThree === "undefined")) {
                            //console.log("110")
                            showcaseCheck = "2";
                        } else if ((showOne !== "undefined") && (showTwo !== "undefined") && (showThree !== "undefined")) {
                            //console.log("111");
                            showcaseCheck = "3";
                        } else if ((showOne === "undefined") && (showTwo !== "undefined") && (showThree === "undefined")) {
                            //console.log("010");
                            showcaseCheck = "1";
                        } else if ((showOne === "undefined") && (showTwo === "undefined") && (showThree !== "undefined")) {
                            //console.log("001");
                            showcaseCheck = "1";
                        } else if ((showOne === "undefined") && (showTwo !== "undefined") && (showThree !== "undefined")) {
                            //console.log("011")
                            showcaseCheck = "2"
                        } else if ((showOne !== "undefined") && (showTwo === "undefined") && (showThree !== "undefined")) {
                            //console.log("101");
                            showcaseCheck = "2";
                        } else {
                            console.log("showcase check bugged");
                            showcaseCheck = "showcase check error"
                        }

                        if (signature !== "undefined") {
                            //console.log("has signature")
                            signatureCheck = "1"
                        } else if (signature === "undefined") {
                            console.log("no bio")
                        }

                        if (worldLevel !== "undefined") {
                            //console.log("world level is above 0")
                            worldLevelCheck = "1"
                        } else if (worldLevel === "undefined") {
                            console.log("world level is 0")
                        }

                        /*
                        DEBUG

                        console.log("Support Check: " + supportCheck)
                        console.log("Support: " + suppChar)
                        console.log();

                        console.log("Showcase Check: " + showcaseCheck)
                        console.log("Showcase one: " + showOne)
                        console.log("Showcase two: " + showTwo)
                        console.log("Showcase three: " + showThree)

                        */

                        // console.log(suppChar)

                        

                        const testEmbed = new EmbedBuilder()
                        .setColor(0x9a7ee7)
                        .setTitle("Profile Information")
                        .setTimestamp()
                        .setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${suppChar}.png`)
                        .addFields(
                            {
                                name: "Username",
                                value: data["detailInfo"]['nickname'],
                                inline: true
                            }, // 603476362
                            {
                                name: "Achievements",
                                value: String(data["detailInfo"]["recordInfo"]['achievementCount']),
                                inline: true
                            },
                            { 
                                name: '\u200B', 
                                value: '\u200B',
                                inline: true
                            },
                            {
                                name: "Characters",
                                value: String(data["detailInfo"]["recordInfo"]['avatarCount']),
                                inline: true
                            },
                            {
                                name: "TL // WL",
                                value: String(data["detailInfo"]['level']) + " // 0",
                                inline: true
                            },
                            {
                                name: "Support",
                                value: "-"
                            },
                            {
                                name: "Showcase",
                                value: 
                                "-" + "\n" + 
                                "-" + "\n" + 
                                "-"
                            },
                            {
                                name: '\u200B',
                                value: "~ *" + "No bio" + "*",
                                inline: true
                            },
                        )

                        if (worldLevelCheck === "1") {
                            testEmbed.spliceFields(4, 1, 
                                {
                                    name: "TL // WL",
                                    value: String(data["detailInfo"]['level']) + " // " + String(data["detailInfo"]['worldLevel']),
                                    inline: true
                                }
                            )
                        }

                        if (supportCheck == "1") {
                            testEmbed.spliceFields(5, 1
                                ,{
                                    name: "Support",
                                    value:
                                    emoteSheet["Colored"][[charSheet[suppChar]["element"]]]["id"] + " " + charSheet[suppChar]["name"] + " - Lv. " + String(data["detailInfo"]['assistAvatarDetail']["level"]),
                                }
                            )
                        }

                        if (showcaseCheck === "3") {
                            testEmbed.spliceFields(6, 1, 
                                {
                                    name: "Showcase",
                                    value: 
                                    emoteSheet["Colored"][[charSheet[showOne]["element"]]]["id"] + " " + charSheet[showOne]["name"] + " - Lv. " + String(data["detailInfo"]['avatarDetailList'][0]["level"]) + "\n" +
                                    emoteSheet["Colored"][[charSheet[showTwo]["element"]]]["id"] + " " + charSheet[showTwo]["name"] + " - Lv. " + String(data["detailInfo"]['avatarDetailList'][1]["level"]) + "\n" +
                                    emoteSheet["Colored"][[charSheet[showThree]["element"]]]["id"] + " " + charSheet[showThree]["name"] + " - Lv. " + String(data["detailInfo"]['avatarDetailList'][2]["level"]),
                                }
                            )
                        } else if (showcaseCheck === "2") {
                            testEmbed.spliceFields(6, 1, 
                                {
                                    name: "Showcase",
                                    value: 
                                    emoteSheet["Colored"][[charSheet[showOne]["element"]]]["id"] + " " + charSheet[showOne]["name"] + " - Lv. " + String(data["detailInfo"]['avatarDetailList'][0]["level"]) + "\n" +
                                    emoteSheet["Colored"][[charSheet[showTwo]["element"]]]["id"] + " " + charSheet[showTwo]["name"] + " - Lv. " + String(data["detailInfo"]['avatarDetailList'][1]["level"]) + "\n" +
                                    "-"
                                }
                            )
                        } else if (showcaseCheck === "1") {
                            testEmbed.spliceFields(6, 1, 
                                {
                                    name: "Showcase",
                                    value: 
                                    emoteSheet["Colored"][[charSheet[showOne]["element"]]]["id"] + " " + charSheet[showOne]["name"] + " - Lv. " + String(data["detailInfo"]['avatarDetailList'][0]["level"]) + "\n" +
                                    "-" + "\n" +
                                    "-"
                                }
                            )
                        }

                        if (signatureCheck === "1") {
                            testEmbed.spliceFields(7, 1, 
                                {
                                    name: '\u200B',
                                    value: "~ *" + String(data["detailInfo"]["signature"]) + "*",
                                    inline: true
                                }
                            )
                        }

                        // emoteSheet["Colored"][[charSheet[suppChar]["element"]]]["id"]
                        // [charSheet[suppChar]["element"]]

                        // .setImage("attachment://1102.png")

                        /*

                            This part is for if there is an empty space in the showcase/support

                        */

                        
                                //{
                                    //name: "test",
                                    //value: "test again"
                                //}
                            //)
                        
            
                        // await wait(4000);

                        interaction.editReply({ embeds: [testEmbed] });
                        await client.close()

                    } else {
                        interaction.editReply({ content: "Invalid Profile UID... somehow?? lmk if this happens`"})
                        await client.close()
                    }
                    
                    
                } else {
                        interaction.editReply('Make sure to run the command </register:1173561826936635402> to register your UID to the bot!')
                        await client.close()
                }

                } catch (error) {
                    console.log(`There was an error: ${error}`)
                    interaction.editReply({ content: "Something broke!"})
                    await client.close()
            }
        })();
    }
}