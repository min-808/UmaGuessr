// Make sure to client.close after using this function, cuz it doesn't close here

var { MongoClient } = require("mongodb");
const missionSheet = require('../../../Code/Bots/Seele/src/assets/missions.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    init: async function(id, db, collection) {
        var client = new MongoClient(uri)

        var database = client.db(db);
        var ids = database.collection(collection)

        // Randomize missions

        var missions = []

        while (missions.length < 5) {
            var randomNum = Math.floor(Math.random() * Object.keys(missionSheet).length) // Grabs a random id
            if (missions.indexOf(randomNum) === -1) { // Ensures uniqueness
                missions.push(randomNum)
            }
        }

        console.log(missions)

        const doc = {
            discord_id: id,
            jade_count: 0,
            credits: 0,
            fuel: 1,
            exp_material: 10,
            exp: 0,
            level: 1,
            bonus_claimed: false,
            missions_completed: false,
            missions_claimed: false,
            daily_timer: 0,
            weekly_timer: 0,
            calyx_timer: 0,
            assignment_level: 0,
            calyx_level: 1,
            trailblaze_power_used_today: 0,
            trailblaze_power: 240,
            max_trailblaze_power: 240,
            team: [
                {
                    "id": -1,
                },
                {
                    "id": -1,
                },
                {
                    "id": -1,
                },
                {
                    "id": -1,
                },
            ],
            inventory: {},
            characters: { 
                8004: { // Trailblazer m7 dh
                    "level": 1,
                    "asc_level": 0,
                    "lc": -1,
                    "eidolon": 0,
                    "inTeam": true
                },
                1001: {
                    "level": 1,
                    "asc_level": 0,
                    "lc": -1,
                    "eidolon": 0,
                    "inTeam": true
                },
                1002: {
                    "level": 1,
                    "asc_level": 0,
                    "lc": -1,
                    "eidolon": 0,
                    "inTeam": true
                }
            },
            missions: [
                { 
                    "id": missionSheet[missions[0]]['id'],
                    "description": missionSheet[missions[0]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[1]]['id'],
                    "description": missionSheet[missions[1]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[2]]['id'],
                    "description": missionSheet[missions[2]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[3]]['id'],
                    "description": missionSheet[missions[3]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
                { 
                    "id": missionSheet[missions[4]]['id'],
                    "description": missionSheet[missions[4]]['description'],
                    "reward": 75,
                    "completed": false,
                    "completed_symbol": "❌"
                },
            ],
            wish_count: 0,
            four_star_pity: 0,
            five_star_pity: 0
        }
    
        const result = await ids.insertOne(doc);

        await ids.updateOne({discord_id: id}, {
            $set: {
                "team.0.id": 8004,
                "team.1.id": 1001,
                "team.2.id": 1002,
            }
        })

        console.log(`A new entry was inserted with the _id: ${result.insertedId}`);
    }
}
