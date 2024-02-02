import express from 'express';
const router = express.Router();
import bcrypt  from 'bcrypt';
import nodemailer from 'nodemailer';
import { reduceItemQuantity, addCustomizeOrdersToDb, addOrdersToDb, addUser, findCustomizedOrdersByEmail, findOrdersByEmail, findUser, findUserById, generateJWT, generateResetJWT, getNonVegMenu, getOptions, getRecommendedMenu, getVegMenu, updatePassword } from '../db/userDB.js';
import jwt from 'jsonwebtoken';
import { isAuthenticated } from './auth.js';
import Razorpay  from 'razorpay';
import crypto from 'crypto';
 
//NEW USER SIGNUP

router.post('/signup', async (req, res) => {
try {
    //DESTRUCTING EMAIL & PASSWORD
    const {email,password}= req.body;
  
    //CHECKING EMAIL ALREADY IN USE
        const user = await findUser(email);
        if(user){
              res.status(400).json({err:"Email already in use, Please SignUp with another email"})
              return;
            }
        // SALTING AND HASHING PASSWORD
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt);
        const hashedUser = {...req.body,password:hashedPassword}
 
       
        
        //ADDING DETAILS TO DB
        await addUser(hashedUser);
        console.log(addUser);
        if(addUser){
             //GENERATING AUTHENTICATION TOKEN
        const token = generateJWT(addUser._id)
            res.status(200).json({token:token,message:"SignedUp Successfully"})
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

    const existingUser = await findUser(email)
    if(!existingUser){
          res.status(400).json({err:"Invalid Credentials! Please Signup First"})
          return;
    }
        //VALIDATING PASSWORD

      const validatePassword = await bcrypt.compare(password,existingUser.password)
      if(!validatePassword) {
          res.status(400).json({err:"Invalid Password"})
          return;
    }
    //GENERATING JSONWEBTOKEN
  const token = generateJWT(existingUser._id);
  res.status(200).json({ token:token })

   } catch (error) {
    console.error(error)
    res.status(400).json({err:error.message})
    return;
   }
})

//FORGET-PASSWORD ROUTE

router.post('/forgetpassword', async (req, res) => {
    try {
        const {email} = req.body;
        const existingUser = await findUser(email)
        
        // console.log(existingUser._id)

        if(!existingUser){
              res.status(404).json({err:"Please Enter Your Registered Email!!"})
              return;
        }
        //GENERATING JSONWEBTOKEN FOR RESETTING PASSWORD!

        const resetToken = generateResetJWT(existingUser._id )
 
            const resetPasswordLink = `https://cheese-factory.netlify.app/users/resetpassword/${existingUser._id}/${resetToken}`
         // SENDING RESET-PASSWORD-LINK TO USER-EMAIL
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
            res.status(200).json({data:{id:existingUser._id,token:resetToken,message:"email successfully sent"}})

    } catch (error) {
        console.log(error)
        res.status(500).json({err:error.message});
        return;
    }
})

router.post('/resetpassword/:id/:token', async (req, res) => {
    try {
    
        const {id,token} = req.params;
          const {newPassword, confirmPassword} = req.body;
  
        const existingUser = await findUserById(id);


        if (!existingUser) {
              res.status(400).json({ err: 'User not found' } );
              return;
            }

          //VERIFYING JWT TOKEN 
          jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
            if (err) {
                res.status(400).json({ err: 'Invalid or expired token'} );
                return;
            }else {
                // Access decoded data
                console.log(decoded.id)
              }
        })
         //CHECKING PASSWORDS MATCHING
         if(newPassword !== confirmPassword ) {
              res.status(400).json({err:"Password's Not Matching"}) 
              return; 
          }
          //HASHING PASSWORD
         const salt = await bcrypt.genSalt(10);
         const newHashedPassword = await bcrypt.hash(newPassword, salt)
         //UPDATING NEW PASSWORD
 const updatingPassword = await updatePassword(id,newHashedPassword)
  if(updatingPassword){
    res.status(200).json({changed: true,message:"Password Changed Successfully"})
    return;
}
 
  } catch (error) {
    console.error('Error during password reset:', error);
      res.status(500).json({ err: 'Internal server error', error });
      return;
  }
})

//PIZZA MENU 
router.post("/home", isAuthenticated, async (req, res) => {
    try {
      const recommendedMenu = await getRecommendedMenu();
      const vegMenu = await getVegMenu();
      const nonVegMenu = await getNonVegMenu();
      const crustOptions = await getOptions("crust");
      const sausageOptions = await getOptions("sausage");
      const cheeseOptions = await getOptions("cheese");
      const veggiesOptions = await getOptions("veggies");
      const meatOptions = await getOptions("meat");
        

      if (recommendedMenu && vegMenu && nonVegMenu) {
        res.status(200).json({recommended: recommendedMenu, veg: vegMenu, nonVeg: nonVegMenu,allMenu : [...recommendedMenu,...vegMenu,...nonVegMenu], crust:crustOptions,sausage:sausageOptions,cheese:cheeseOptions,veggies:veggiesOptions,meat:meatOptions });
        return;
      } else {
        res.status(404).json({ err: "Menu not found" });
        return;
      }
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
      return;
    }
  });

  router.post('/create-order',async (req,res)=>{ 
    try {
       
      const razorpay = new Razorpay({
        key_id:process.env.MY_KEY_ID,
        key_secret:process.env.MY_SECRET_KEY,
      })
     const { amount} = req.body
 
     const options = {
      amount : Number(amount) * 100,
      currency: 'INR',
     }
    
      const order = await razorpay.orders.create(options)
      res.status(200).json(order);
         
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).send('Error creating Razorpay order'); 
    }
  }) 

  router.post('/verify',async (req,res)=>{
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        cart,
        customizeData,
      } = req.body;

      const signString = 
      `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature = crypto.createHmac("sha256",process.env.MY_SECRET_KEY).update(signString).digest("hex");

      if (expectedSignature === razorpay_signature) {
       
        if (cart) {
          const saveOrders = await addOrdersToDb(cart);
          if (saveOrders.acknowledged === true) {
            console.log("Orders saved");
          } else {
            console.log("Error Saving Orders");
          }
        }  

        if (customizeData) {
          const saveCustomizeOrders = await addCustomizeOrdersToDb(customizeData);
          if (saveCustomizeOrders?.acknowledged === true) {
            console.log("Customized Orders saved");
          } else {
            console.log("Error Saving Customized Orders");
          }
        }  

      console.log('Payment verification successful');
       return res.status(200).send('Payment verification successful');
      }   
      
    } catch (error) {
      console.log(error.message)
      res.status(500).json(error)
    } 
  })
  router.post('/orders',async (req,res)=>{
    try {
      const {email} = req.body;
      
      const orders = await findOrdersByEmail(email);

      const customizedOrders = await findCustomizedOrdersByEmail(email);
     
      console.log(customizedOrders);

  if (orders || customizedOrders) {
    return res.status(200).json({orders: orders ? orders : {}, customizedOrders: customizedOrders ? customizedOrders : {}});
  }    
    } catch (error) {
      console.error(error)
      res.status(500).json(error)
    }
  })

router.post('/quantityupdate', async (req, res)=>{
try {

const { customizeData} = req.body;
var menuName;

const crust = async () => {
  for (const item of customizeData) {
     menuName = 'crust';  
       await reduceItemQuantity(menuName, item.selectedCrust._id);
     
  }
}
await crust();

const sausage = async () => {
  for (const item of customizeData) {
    var menuName = 'sausage';  
      await reduceItemQuantity(menuName, item.selectedSausage._id);
       
  }
}
await sausage();
 
const cheese = async () => {
  for (const item of customizeData) {
    var menuName = 'cheese';  
     await reduceItemQuantity(menuName, item.selectedCheese._id);
      
  }
}
await cheese();
 
let veggiesIds = async () =>{
    menuName = 'veggies';

    for(let item of customizeData){

      for(let it of item.selectedVeggies){
         await reduceItemQuantity(menuName,it._id);  
      }
    }
     
}
await veggiesIds();

 
 let meats = async () =>{
  menuName = 'meat';
  for(let item of customizeData){
     
    for(let it of item.selectedMeats){
       
        await reduceItemQuantity(menuName,it._id); 
    }
  }
}
await meats()

} catch (error) {
  console.error(error);
  res.status(500).json(error)
}

})

export const userRouter = router;