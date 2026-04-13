import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client;
let db;

const connectDB = async () => {
    try {
        if (!client) {
            const mongoURI = process.env.MONGO_URI;
            client = new MongoClient(mongoURI);
            await client.connect();
            console.log("✅ Connected to MongoDB");
  
        }
        
        const dbName = process.env.DB_NAME || "ChatDB";
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

export default connectDB;