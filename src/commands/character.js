const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const charSheet = require('../../src/assets/characters.json')
/*
var xml = new XMLHttpRequest();
XMLHttpRequest.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        var obj = JSON.parse(this.responseText);
    }
}
xmlhttp.open("GET", "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_new/en/characters.json", true);
xmlhttp.send();

*/

const charDesc = require ('../../src/assets/descriptions.json')
const charId = require('../../src/assets/char-id.json')
const emoteSheet = require('../../src/assets/emotes.json')
const paths = require('../../src/assets/paths.json')
const charSkills = require('../../src/assets/character_skills.json')
const matsRequired = require('../../src/assets/character_promotions.json')
const items = require('../../src/assets/items.json')

// let choices = ['March 7th', 'Dan Heng', 'Himeko', 'Welt', 'Kafka', 'Silver Wolf', 'Arlan', 'Asta', 'Herta', 'Bronya', 'Seele', 'Serval', 'Gepard', 'Natasha', 'Pela', 'Clara', 'Sampo', 'Hook', 'Qingque', 'Tingyun', 'Luocha', 'Jing Yuan', 'Blade', 'Sushang', 'Yukong', 'Yanqing', 'Bailu', 'Trailblazer', 'Lynx', 'Jingliu', 'Guinaifen', 'Fu Xuan', 'Topaz', 'Hanya', 'Huohuo', 'Argenti']
let newChoices = []
let filteredChoices = []

var count = Object.keys(charSheet).length
var countId = Object.keys(charId).length

// Push all char names to newChoices
for (var i = 0; i < count; i++) {
    newChoices.push(Object.values(charSheet)[i].name)
}

// Filter it so the array is holding only unique values
filteredChoices = newChoices.filter(function(item, pos) {
    return newChoices.indexOf(item) == pos
})

choices = filteredChoices

module.exports = {
    data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Returns information about a character')
    //.setDescription('TEST COMMAND')
    .addStringOption((option) => 
        option
            .setName("character")
            .setDescription("Enter a character")
            .setRequired(true)
            .setAutocomplete(true)),

    async autocomplete (interaction) {

        const value = interaction.options.getFocused().toLowerCase();

        const filtered = choices.filter(choice => choice.toLowerCase().includes(value)).slice(0, 25);

        if (!interaction) return;

        await interaction.respond(
            filtered.map(choice => ({ name: choice, value: choice }))
        );
    }

    ,
    run: async ({ interaction }) => {
        await interaction.deferReply()

        const theResponse = interaction.options.get('character').value;
        var query = theResponse
        var id = ""
        var dId = ""

        // Connect name and id
        for (var i = 0; i < count; i++) {
            if (Object.values(charSheet)[i].name == query) {
                id = Object.values(charSheet)[i].id
            }
        }

        // Connect dId and id
        for (var j = 0; j < countId; j++) {
            if (Object.values(charId)[j].id == id) {
                dId = Object.values(charId)[j].dId
            }
        }

        /*
        if (theResponse.includes(" ")) {
            const first = theResponse.charAt(0).toUpperCase() + theResponse.slice(1, theResponse.indexOf(" ") + 1) // Silver_
            const second = theResponse.charAt(theResponse.indexOf(" ") + 1).toUpperCase() + theResponse.slice(theResponse.indexOf(" ") + 2) // Wolf
            query = first + second;
        }
        */

        if (!choices.includes(query)) {
            interaction.editReply({
                content: "Unable to find character. Check the spelling or select from list",
                ephemeral: true
            })
            return;
            // i prob could've just added an else statement and put the below code in it but this works too
        }

        const selectedChar = id
        const numRarity = charSheet[selectedChar]["rarity"];

        const testEmbed = new EmbedBuilder()
            .setColor(0x9a7ee7)
            .setTitle(emoteSheet["Colored"][[charSheet[selectedChar]["element"]]]["id"] + " " + charSheet[selectedChar]["name"])
            .setTimestamp()
            .setThumbnail(`https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${selectedChar}.png`)
            .addFields(
                {
                    name: "Description",
                    value: charDesc[dId]["desc"].replaceAll('\\n', '\n').replaceAll('{NICKNAME}', "Trailblazer").replaceAll('A {F#girl}{M#boy}', "One"),
                },
                {
                    name: "Rarity",
                    value: String("-"),
                },
                {
                    name: "Path",
                    value: emoteSheet["Paths"][paths[charSheet[selectedChar]["path"]]["text"].replaceAll("The ", "")]["id"] + " " + paths[charSheet[selectedChar]["path"]]["text"]
                },
                {
                    name: "Skills",
                    value: 
                    charSkills[charSheet[selectedChar]["skills"][0]]["type_text"] + " - " + charSkills[charSheet[selectedChar]["skills"][0]]["name"] + "\n" +
                    charSkills[charSheet[selectedChar]["skills"][1]]["type_text"] + " - " + charSkills[charSheet[selectedChar]["skills"][1]]["name"] + "\n" +
                    charSkills[charSheet[selectedChar]["skills"][2]]["type_text"] + " - " + charSkills[charSheet[selectedChar]["skills"][2]]["name"] + "\n" +
                    charSkills[charSheet[selectedChar]["skills"][3]]["type_text"] + " - " + charSkills[charSheet[selectedChar]["skills"][3]]["name"] + "\n" +
                    charSkills[charSheet[selectedChar]["skills"][5]]["type_text"] + " - " + charSkills[charSheet[selectedChar]["skills"][5]]["name"] + "\n"
                },
                {
                    name: "Materials",
                    value: "-"
                }
            )

        var ids = [];
        var nums = [];

        var k = 0;

        ids[0] = matsRequired[selectedChar]["materials"][0][0]["id"]

        for (var i = 0; i < matsRequired[selectedChar]["materials"].length - 1; i++) {
            for (var j = 0; j < matsRequired[selectedChar]["materials"][i].length; j++) {
                // console.log(matsRequired[selectedChar]["materials"][i][j]["id"])
                if (!ids.includes(matsRequired[selectedChar]["materials"][i][j]["id"])) {
                    k++
                    ids[k] = matsRequired[selectedChar]["materials"][i][j]["id"]
                }

                //console.log(`${i} & ${j}`)
            }
        }

        for (var i = 0; i < matsRequired[selectedChar]["materials"].length - 1; i++) {
            for (var j = 0; j < matsRequired[selectedChar]["materials"][i].length; j++) {
                var currentIndex = ids.indexOf(matsRequired[selectedChar]["materials"][i][j]["id"])
                if (nums[currentIndex] == null) {
                    nums[currentIndex] = 0
                }
                nums[currentIndex] += matsRequired[selectedChar]["materials"][i][j]["num"]
            }
        }

        //console.log(ids)
        //console.log(nums)
        var format = "";

        var readable = [];

        for (var i = 0; i < ids.length; i++) {
            readable.push(`\`${nums[i]}x\` ${items[ids[i]]["name"]}`)
            format += `${readable[i]} \n`
        }

        testEmbed.spliceFields(4, 1, {
            name: "Materials",
            value: format
        }
        )
        
        if (numRarity === 3) {
            testEmbed.spliceFields(1, 1, 
                {
                    name: "Rarity",
                    value: String(emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]),
                }
            )
        } else if (numRarity === 4) {
            testEmbed.spliceFields(1, 1, 
                {
                    name: "Rarity",
                    value: String(emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]),
                }
            )
        } else if (numRarity === 5) {
            testEmbed.spliceFields(1, 1, 
                {
                    name: "Rarity",
                    value: String(emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"] + emoteSheet["Stars"]["StarBig"]["id"]),
                }
            )
        }
                
        interaction.editReply({ 

            embeds: [testEmbed]

         })
    }
}
