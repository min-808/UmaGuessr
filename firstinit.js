// Make sure to client.close after using this function, cuz it doesn't close here

var { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    init: async function(id, db, collection) {
        var client = new MongoClient(uri)

        var database = client.db(db);
        var ids = database.collection(collection)
        var discordID = id
    
        const doc = {
            discord_id: parseInt(discordID),
            jade_count: 0,
            daily_timer: 0,
            assignment_timer: 0,
            max_assignments: 1,
            trailblaze_power: 240,
            max_trailblaze_power: 240,
            inventory: {},
            characters: { 
                8001: { // Trailblazer m7 dh
                    "level": 1,
                    "lc": -1,
                    "eidolon": 0
                },
                1001: {
                    "level": 1,
                    "lc": -1,
                    "eidolon": 0
                },
                1002: {
                    "level": 1,
                    "lc": -1,
                    "eidolon": 0
                }
            },
            wish_count: 0,
            four_star_pity: 0,
            five_star_pity: 0
        }
    
        const result = await ids.insertOne(doc);
        console.log(`A new entry was inserted with the _id: ${result.insertedId}`);
    }
}
