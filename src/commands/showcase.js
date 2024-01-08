const { SlashCommandBuilder } = require('discord.js');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const charSheet = require('../../src/assets/characters.json')
const emoteSheet = require('../../src/assets/emotes.json')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('showcase')
    .setDescription('Returns information about your character showcase')
    //.setDescription('TEST COMMAND')
    .addNumberOption((option => 
        option
            .setName("uid")
            .setDescription("Enter your Star Rail UID")
            .setRequired(true)
        )
    )
        
    ,
    run: ({ interaction }) => {

        const userUID = interaction.options.get('uid').value;

        (async () => {

            await interaction.deferReply()

            try {
                
                const res = await fetch("https://api.mihomo.me/sr_info/" + userUID + "?lang=en");
                if (res.ok) {
                    const data = await res.json();

                    console.log(data, { depth: null }) // .dir for full

                    var suppChar = String(data?.["detailInfo"]?.['assistAvatarDetail']?.["avatarId"]);

                    var showOne = String(data?.["detailInfo"]?.['avatarDetailList']?.[0]?.["avatarId"])
                    var showTwo = String(data?.["detailInfo"]?.['avatarDetailList']?.[1]?.["avatarId"]);
                    var showThree = String(data?.["detailInfo"]?.['avatarDetailList']?.[2]?.["avatarId"]);

                    var supportCheck = "0";
                    var showcaseCheck = "000";

                    if (suppChar !== "undefined") {
                        console.log("has supp")
                        supportCheck = "1";
                    } else {
                        console.log("no supp")
                    }

                    if ((showOne === "undefined") && (showTwo === "undefined") && (showThree === "undefined")) {
                        console.log("000")
                        showcaseCheck = "0";
                    } else if ((showOne !== "undefined") && (showTwo === "undefined") && (showThree === "undefined")) {
                        console.log("100")
                        showcaseCheck = "1"
                    } else if ((showOne !== "undefined") && (showTwo !== "undefined") && (showThree === "undefined")) {
                        console.log("110")
                        showcaseCheck = "2";
                    } else if ((showOne !== "undefined") && (showTwo !== "undefined") && (showThree !== "undefined")) {
                        console.log("111");
                        showcaseCheck = "3";
                    } else if ((showOne === "undefined") && (showTwo !== "undefined") && (showThree === "undefined")) {
                        console.log("010");
                        showcaseCheck = "1";
                    } else if ((showOne === "undefined") && (showTwo === "undefined") && (showThree !== "undefined")) {
                        console.log("001");
                        showcaseCheck = "1";
                    } else if ((showOne === "undefined") && (showTwo !== "undefined") && (showThree !== "undefined")) {
                        console.log("011")
                        showcaseCheck = "2"
                    } else if ((showOne !== "undefined") && (showTwo === "undefined") && (showThree !== "undefined")) {
                        console.log("101");
                        showcaseCheck = "2";
                    } else {
                        console.log("showcase check bugged");
                        showcaseCheck = "showcase check error"
                    }

                    const testEmbed = new EmbedBuilder()
                    .setColor(0x9a7ee7)
                    .setTitle("Showcase Information")
                    .setTimestamp()
                    .addFields(
                        {
                            name: "Support Character",
                            value: emoteSheet["Colored"][[charSheet[suppChar]["element"]]]["id"] + " " + charSheet[suppChar]["name"] + "\n" + 
                            emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + "\n" +  
                            "- Lv. " + String(data["detailInfo"]['assistAvatarDetail']["level"]),
                            inline: true
                        }, // 603476362
                    )






                        /*

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

                    */













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
                    
        
                    interaction.editReply({ embeds: [testEmbed]});

                } else {
                    interaction.editReply({ content: "Invalid Profile UID: `" + interaction.options.get('uid').value + "`" })
                }

            } catch (error) {
                console.log(`There was an error: ${error.stack}`)
            }
        })();
    }
}
