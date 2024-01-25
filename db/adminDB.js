// import  jwt  from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { client } from "../db.js";

export function findAdmin(userEmail){
    return client.db("pizza")
    .collection("admins")
    .findOne({email:userEmail})
}
export function addAdmin(hashedUser){
    return client.db("pizza")
    .collection("admins")
    .insertOne(hashedUser);
}

// export function generateJWTfo(_id){
//     return jwt.sign({_id},process.env.SECRET_KEY,{expiresIn:"30d"})
// }

// export function generateResetJWT(id){ 
//     return jwt.sign({id},process.env.SECRET_KEY,{expiresIn:'10m'})
// }

export function findAdminById(id){
return client.db("pizza")
.collection("admins")
.findOne({_id: new ObjectId(id)});
}
 
export function updateAdminPassword(id,newhashedpassword){
    return client.db("pizza")
    .collection("admins")
    .findOneAndUpdate({_id: new ObjectId(id)},{$set:{password:newhashedpassword}})
}
 
export function getMenuOrders(){
    return client.db("pizza").collection("orders").find().toArray()
}

export function getCustomizedOrders (){
    return client.db("pizza").collection("customizeOrders").find().toArray()
}
 export function changeMenuOrderStatus(id,newStatus){
    return client.db("pizza").collection("orders").findOneAndUpdate({_id: new ObjectId(id)},{$set:{OrderStatus:newStatus}})
 }

 export function changeCustomizedOrderStatus(id,newStatus){
    return client.db("pizza").collection("customizeOrders").findOneAndUpdate({_id: new ObjectId(id)},{$set:{OrderStatus:newStatus}})
 }

 export function addQuantity(name, value, id) {
    return client.db("menu").collection(name).findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $inc: { quantity: +value } }
    );
}
