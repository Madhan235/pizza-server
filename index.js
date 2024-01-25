import express from 'express';
 import { client } from './db.js';
 import cors from 'cors';
import { userRouter } from './routers/users.js';
import dotenv from 'dotenv';
import { adminRouter } from './routers/admin.js';
 

dotenv.config();
// console.clear();
const app = express();
app.use(express.json());
app.use(cors());
 
 
app.use("/users", userRouter)
app.use("/admins", adminRouter)


 

app.listen(process.env.PORT, ()=>{
    console.log("server listening on PORT");
})