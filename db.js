import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

const mongoURI = process.env.MONGO_URI;
const db_name = process.env.MONGO_DB_NAME;

async function connectToDatabase() {
    try {
        const client = new MongoClient(mongoURI);
        await client.connect();
        console.log(`Successful connection to database ${db_name}`);
        let db = client.db(db_name);
        return db;
    } catch (error) {
        console.error("Error on connecting to database", error);
        throw error;
    }
}

export { connectToDatabase };
