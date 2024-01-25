import { MongoClient } from "mongodb"
import dotenv from 'dotenv';
dotenv.config();
const URL = process.env.mongoURL

async function createConnection(){
   try {
    const client = new MongoClient(URL)
    await client.connect()
    console.log("Connected to MongoDB")
    return client;
   } catch (error) {
    console.log(error)
   } 
     
}
 


// async function closeConnection(client) {
//    try {
//        await client.close();
//        console.log("Closed MongoDB connection");
//    } catch (error) {
//        console.error("Error closing MongoDB connection:", error);
//    }
// }


export const client = await createConnection()