import  jwt  from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { client } from "../db.js";

export function findUser(userEmail){
    return client.db("pizza")
    .collection("users")
    .findOne({email:userEmail})
}
export function addUser(hashedUser){
    return client.db("pizza")
    .collection("users")
    .insertOne(hashedUser);
}

export function generateJWT(_id){
    return jwt.sign({_id},process.env.SECRET_KEY,{expiresIn:"30d"})
}

export function generateResetJWT(id){ 
    return jwt.sign({id},process.env.SECRET_KEY,{expiresIn:'10m'})
}

export function findUserById(id){
return client.db("pizza")
.collection("users")
.findOne({_id: new ObjectId(id)});
}
 
export function updatePassword(id,newhashedpassword){
    return client.db("pizza")
    .collection("users")
    .findOneAndUpdate({_id: new ObjectId(id)},{$set:{password:newhashedpassword}})
}

export function getRecommendedMenu(){
    return client.db("menu").collection("recommended").find().toArray();
}

export function getVegMenu(){
    return client.db("menu").collection("veg").find().toArray();

}export function getNonVegMenu(){
    return client.db("menu").collection("nonveg").find().toArray();
}

export function getOptions (option){
    return client.db("menu").collection(option).find().toArray();
}
export function findOrdersByEmail(email){
    return client.db("pizza").collection("orders").find({email:email}).toArray();
}

export function findCustomizedOrdersByEmail(email){
    return client.db("pizza").collection("customizeOrders").find({email:email}).toArray();
}

export function addOrdersToDb(ordersArr){
    const ordersCollection = client.db("pizza").collection("orders")

    return  ordersCollection.insertMany(ordersArr);

}
export function addCustomizeOrdersToDb(customizeData){
    return client.db("pizza").collection("customizeOrders").insertMany(customizeData)
}

export function reduceItemQuantity(item,id){
    return client.db("menu").collection(item
    ).findOneAndUpdate({_id: new ObjectId(id)},{$inc:{quantity: - 1}})
}