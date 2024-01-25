import express from 'express';
const router = express.Router();
import bcrypt  from 'bcrypt';
import nodemailer from 'nodemailer';
import {  generateJWT, generateResetJWT, getOptions} from '../db/userDB.js';
import { addAdmin, addQuantity, changeCustomizedOrderStatus, changeMenuOrderStatus, findAdmin, findAdminById, getCustomizedOrders, getMenuOrders, updateAdminPassword } from '../db/adminDB.js';
import jwt from "jsonwebtoken";

//NEW ADMIN SIGNUP

router.post('/signup', async (req, res) => {
try {
    //DESTRUCTING EMAIL & PASSWORD
    const {email,password}= req.body;
     
    //CHECKING EMAIL ALREADY IN USE
        const admin = await findAdmin(email);
        if(admin){
              res.status(400).json({err:"Email already Registered"})
              return;
        }
        // SALTING AND HASHING PASSWORD
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);
        const hashedAdmin = {...req.body,password:hashedPassword}

        //ADDING DETAILS TO DB
        await addAdmin(hashedAdmin);
        if(hashedAdmin){
          //GENERATING AUTHENTICATION TOKEN
          const token = generateJWT(addAdmin._id)
          res.status(200).json({token:token, message:"Signed-Up Successfully"})
          return;
        }
        
} catch (error) {
    console.error(error)
    res.status(500).json({err: error.message})
    return;
}
})

// EXISTING USER LOGIN

router.post('/login', async (req,res)=>{
   try {
    //CHECKING USER EXISTS
    const {email,password} = req.body

    const existingAdmin = await findAdmin(email)
    if(!existingAdmin){
          res.status(400).json({err:"Invalid Credentials! Please Signup First"})
          return;
    }
        //VALIDATING PASSWORD

      const validatePassword = await bcrypt.compare(password,existingAdmin.password)
      if(!validatePassword) {
          res.status(400).json({err:"Invalid Password"})
          return;
    }
    //GENERATING JSONWEBTOKEN
  const token = generateJWT(existingAdmin._id);
  res.status(200).json({token:token })

   } catch (error) {
    console.error(error)
    res.status(400).json({ err:error.message})
    return;
   }
})

//FORGET-PASSWORD ROUTE

router.post('/forgetpassword', async (req, res) => {
    try {
        const {email} = req.body;
        const existingAdmin = await findAdmin(email)
        // console.log(existingUser._id)
        if(!existingAdmin){
              res.status(404).json( {err:"Please Enter Your Registered Email!!"})
              return;
        }
        //GENERATING JSONWEBTOKEN FOR RESETTING PASSWORD!

        const resetToken = generateResetJWT(existingAdmin._id )
       
            const resetPasswordLink = `http://localhost:3000/admins/resetpassword/${existingAdmin._id}/${resetToken}`
         // SENDING RESET-PASSWORD-LINK TO ADMIN-EMAIL
            let transporter  = nodemailer.createTransport({
               service: "gmail",
               auth:{
                user:"msouljar@gmail.com",
                pass:process.env.MAIL_PASSWORD,
               }
            })
            let mailDetails = {
                from:"msouljar@gmail.com",
                to:`${email}`,
                subject:"RESET PASSWORD LINK",
                text:`${resetPasswordLink}`
            }
            transporter.sendMail(mailDetails, function(err){
                if(err){
                    console.error(err)
                    return;
                } else{
                    console.log("Email sent successfully")
                }
            })
            res.status(200).json({data:{id:existingAdmin._id,token:resetToken,message:"email successfully sent"}})

    } catch (error) {
        console.log(error)
        res.send(error.message);
        return;
    }
})

router.post('/resetpassword/:id/:token', async (req, res) => {
    try {
    
        const {id,token} = req.params;

        const {newPassword, confirmPassword} = req.body;
         
        const existingAdmin = await findAdminById(id)
        
        if (!existingAdmin) {
              res.status(404).json({err: 'Admin not found' } );
              return;
          }

          //VERIFYING JWT TOKEN 
          jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                res.status(400).json({ err: 'Invalid or expired token',err } );
                return;
            }else {
                // Access decoded data
                console.log(decoded.id);
              }
        })
         //CHECKING PASSWORDS MATCHING
         if(newPassword !== confirmPassword) {
              res.status(400).json({err:"Password's Not Matching"}) 
              return; 
          }
          //HASHING PASSWORD
         const salt = await bcrypt.genSalt(10);
         const newHashedPassword = await bcrypt.hash(newPassword, salt)
         //UPDATING NEW PASSWORD
 const updateAdminPass = await updateAdminPassword(id,newHashedPassword)
if(updateAdminPass){
    res.status(200).json({changed: true,message:"Password Changed Successfully"})
    return;
}
    } catch (error) {
        console.error(error);
        res.status(400).json({err:error.message})
        return;
    }
})

router.get('/allorders',async (req,res)=>{
    try {
        const menuOrders = await getMenuOrders();
        const customizedOrders = await getCustomizedOrders();
 
        res.status(200).json({menuOrders:menuOrders,customizedOrders:customizedOrders});
            console.log("admin fetched all orders")
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

router.post('/updatestatus/menu',async (req,res)=>{
    try {
        const {newStatus,id } = req.body;
        
        const updatingStatus = await changeMenuOrderStatus(id,newStatus);
            
        const updatedOrders = await getMenuOrders()
        res.status(200).json(updatedOrders);
        
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})
router.post('/updatestatus/customized',async (req,res)=>{
    try {
        const {newStatus,id } = req.body;
         
        const updatingStatus = await changeCustomizedOrderStatus(id,newStatus);
            
        const updatedOrders = await getCustomizedOrders()
        res.status(200).json(updatedOrders);
        
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

router.post('/quantity/alert', async (req,res)=>{
try {
    const {adminMail,crustName,sausageName,cheeseName,veggiesNames,meatNames} = req.body
 
    let transporter  = nodemailer.createTransport({
        service: "gmail",
        auth:{
         user:"msouljar@gmail.com",
         pass:process.env.MAIL_PASSWORD,
        }
     })
     let mailDetails = {
        from:"msouljar@gmail.com",
        to:`${adminMail}`,
        subject:"Stock Alert",
        text: `${crustName}, ${sausageName}, ${cheeseName}, ${veggiesNames}, ${meatNames} - these items are below the stock level of 20! Please update them promptly.`, 
    }

    transporter.sendMail(mailDetails,function(err){
        if(err){
            console.error(err)
            return;
        } else{
            console.log("Alert sent successfully")
        }
    })

    res.status(200).json(` Alert mail sent to ${adminMail}` )

} catch (error) {
    console.error(error);
    res.status(500).json(error);
}

})

router.post('/update/quantity', async (req, res) => {
    try {
        const {value,id,name} = req.body;

    const addingQuantity = await addQuantity(name,value,id)

    if(addingQuantity){
        res.status(200).json(`${name} qunatity updated`)

        console.log(`${name} quantity updated`)
    }
       
    } catch (error) {
        console.log(error);
        res.status(500).json(error.message);
    }

})
export const adminRouter = router;