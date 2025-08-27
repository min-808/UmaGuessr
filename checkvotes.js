// Make sure to client.close after using this function, cuz it doesn't close here

var { MongoClient } = require("mongodb");

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    init: async function(id, db, collection, client) {
        var client_db = new MongoClient(uri)

        var database = client_db.db(db);
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
            quickest_answer: 0,
            inventory: [],
            times: [],
            votes: 0,
        }
    
        const result = await ids.insertOne(doc);

        console.log(`A new entry was inserted with the _id: ${result.insertedId}`);

        const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
            headers: {
                'Authorization': 'Bot ' + process.env.TOKEN
            }
        });

        const parse = await response.json();
        let returnedUsername = String(parse?.username ?? 'Unknown');

        client.users.fetch('236186510326628353').then((user) => { user.send(`User **${returnedUsername}** has registered`) }) 
        // send me a msg when a new user signs up
    }
}
