// Make sure to client.close after using this function, cuz it doesn't close here

var { MongoClient } = require("mongodb");
require('dotenv').config();

module.exports = {
    init: async function(id, db, collection, client) {
        var client_db = new MongoClient(process.env.MONGODB_URI)

        var database = client_db.db(db);
        var ids = database.collection(collection)
        const date = new Date()

        const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
                headers: {
                    'Authorization': 'Bot ' + process.env.TOKEN
                }
            });

        const parse = await response.json()
        let retUsername = String(parse?.username ?? 'Unknown')
        let retDiscriminator = String(parse?.discriminator ?? 'Unknown')
        
        if (retDiscriminator == '0') {
          retDiscriminator = ""
        } else {
          retDiscriminator = "#" + retDiscriminator
        }

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
            daily_streak: 0,
            votes: 0,
            username: retUsername + retDiscriminator,
            vote_timer: 0,
            signup: date.toISOString(),
            strict: false,
        }
    
        const result = await ids.insertOne(doc);

        console.log(`A new entry was inserted with the _id: ${result.insertedId}. Username: ${retUsername + retDiscriminator}, ID: ${id}`);

        client.strictCache.set(id, false) // cache their strict settings to false when a new user signs up

        client.channels.fetch('1410434305858994249').then((channel) => { channel.send(`User **${retUsername + retDiscriminator}** has registered`) }).catch(console.error)
        // send me a msg when a new user signs up
    }
}
