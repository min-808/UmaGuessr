// Make sure to client.close after using this function, cuz it doesn't close here

var { MongoClient } = require("mongodb");
const TLSheet = require('../../../Code/Bots/Seele/src/assets/tl.json')

var uri = "mongodb+srv://min:" + process.env.MONGODB_PASS + "@discord-seele.u4g75ks.mongodb.net/"

module.exports = {
    checker: async function(id, db, collection) {
        var levelUp = false

        var client = new MongoClient(uri)

        var database = client.db(db);
        var ids = database.collection(collection)

        var options = {
            projection: {
                level: 1,
                exp: 1,
            }
        }

        var toParseUserUID = await ids.findOne({discord_id: id}, options);
        var level = toParseUserUID['level']
        var exp = toParseUserUID['exp']

        while (exp >= TLSheet[level]["next_exp"]) { // level up
            exp -= TLSheet[level]["next_exp"]
            level++
            levelUp = true
        }

        const setNew = {
            $set: {
                level: level,
                exp: exp,
            }
        }

        await ids.updateOne({discord_id: id}, setNew)

        console.log(level)
        console.log(exp)

        return levelUp
    }
}
