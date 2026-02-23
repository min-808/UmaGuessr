const { getMongoClient } = require('./src/connect-db.js');
require('dotenv').config();

module.exports = {
    init: async function(id, db, collection, client) {
        var client_db = new getMongoClient()

        var database = client_db.db(db);
        var ids = database.collection(collection)
        var counter = database.collection("id_counter")
        const date = new Date()

        const response = await fetch(`https://discord.com/api/v10/users/${id}`, {
                headers: {
                    'Authorization': 'Bot ' + process.env.TOKEN
                }
            });

        const value = await counter.findOneAndUpdate(
            { },
            { $inc: { user_id: 1 } },
            { returnDocument: 'after', upsert: true }
        )

        const newInternalId = value.user_id;

        const parse = await response.json()
        let retUsername = String(parse?.username ?? 'user')
        let retDiscriminator = String(parse?.discriminator ?? 'Unknown')
        
        if (retDiscriminator == '0') {
          retDiscriminator = ""
        } else {
          retDiscriminator = "#" + newInternalId
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
            characters: {},
            guilds: [],
            restrict: false,
            quote: null,
            favorites: [],
            max_favorites: 3,
            user_id: newInternalId,
            sample: [],
        }
    
        const result = await ids.insertOne(doc);

        console.log(`A new entry was inserted with the _id: ${result.insertedId}. Username: ${retUsername + retDiscriminator}, ID: ${id}`);

        client.strictCache.set(id, false) // cache their strict settings to false when a new user signs up

        client.channels.fetch(process.env.REG_LOG_CHANNEL).then((channel) => { channel.send(`User **${retUsername + retDiscriminator}** has registered (#${newInternalId})`) }).catch(console.error)
        // send me a msg when a new user signs up
    }
}
