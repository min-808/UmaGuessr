const { MongoClient } = require('mongodb')

let mongoClient = null

async function connectMongo() {
  if (mongoClient) {
    return mongoClient
  }

  mongoClient = new MongoClient(process.env.MONGODB_URI)
  await mongoClient.connect()
  console.log("MongoClient connected.")
  return mongoClient
}

function getMongoClient() {
  if (!mongoClient) {
    throw new Error("MongoDB client not initialized. Call connectMongo() first.");
  }
  return mongoClient;
}

module.exports = { connectMongo, getMongoClient };