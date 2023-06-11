import { MongoClient } from "mongodb";
// require("dotenv").config({ path: "./.env" })

let db;

async function connectToDB(cb) {
    //const client = new MongoClient('mongodb://127.0.0.1:27017');
    const client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster2.x0rexy8.mongodb.net/?retryWrites=true&w=majority`);
    await client.connect();
    db = client.db('reactBlogDB');
    cb();
}

export {
    db,
    connectToDB
}