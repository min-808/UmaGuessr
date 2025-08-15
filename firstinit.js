// Make sure to client.close after using this function, cuz it doesn't close here

var { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    init: async function(id, db, collection) {
        var client = new MongoClient(uri)

        var database = client.db(db);
        var ids = database.collection(collection)

        const doc = {
            discord_id: id,
            wins: 0,
            streak: 0,
            points: 0,
            points_today: 0,
            wins_today: 0,
            daily_timer: 0,
            type: 'x',
            top_streak: 0,
        }
    
        const result = await ids.insertOne(doc);

        console.log(`A new entry was inserted with the _id: ${result.insertedId}`);
    }
}
