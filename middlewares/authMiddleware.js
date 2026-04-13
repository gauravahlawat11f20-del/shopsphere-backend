// auth middle ware .. means .. after .. login .. we will check ... if the .. the token is there in cokie or not ...

// in this we take our token and compare it with .. secret key

//jwt.verify(token , SECRET_KEY) .. like this // 2nd one is ours .. the token is .. taken from the cookies or local storage

// if .. the signature is cerated by our secret key .. it will return true wither false 

import jwt from "jsonwebtoken"
import blacklistedTokenModel from "../models/BlacklistedTokens.js";

export const authMiddleware = async(req,res,next)=>{
    try{
    let token = req?.cookies?.token;

    if (!token && req.headers?.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("URL:", req.originalUrl);


 //  req.headers = {
//  "content-type": "application/json",
 // "authorization": "Bearer abc123xyz", // we have to get token .. just beside the bearer
 // ...
  //}

  // now    

      

  if(!token){
    return res.status(401).json({"message" : "havent found the token"})
    // so here .. if tthis part runs .. we need to skip the whole code below
  }

 
  // "Bearer abc123xyz" is splited into = [Bearer , abc123xyz]

  // step 1 is done 


    // only for dashboard route 
      // if the token is already blacklisted 
   // return mardo .. taki hacker or i=unauthorized user login na kar sake ..
   
   // manle token tune clear bhi kar diya ...lekin hacker ke paas byChance voh token maujood hua ... toh db se blacklisted token search karke 
   // ye kaam maro  (( i think this is kinda secondary option or main i think  ))

   const ExpiredToken = token;
   const isThere = await blacklistedTokenModel.findOne({ExpiredToken})
   if(isThere){
      console.log("token expired bhi nahi hai")
      return res.status(400).json({message : "token is expired already"})
   }   // done

  // now verify

  console.log("yahan dikkt hai pakka ")

  const decoded = jwt.verify(token , process.env.SECRET_KEY || process.env.JWT_SECRET)
  // jabhi true tab .. jo stored token create by scret id hoga ... 
  // hacker secreat id .. access nhi kar sakta toh ... same signature dena impossible hai .. 
 

 // If the token is valid → it returns the decoded payload (decoded)

  //If the token is invalid or expired → it throws an error

   console.log("JWT DECODED:", decoded);


  req.user = decoded.ID;
  req.userId = decoded.ID;
  req.tokenExp = decoded.exp;
   console.log( "lets check for this : " + req.user)
   console.log("req.user value:", req.user);
console.log("req.user type:", typeof req.user);
 // decoded ===> user in the DB
     // cuz while creating the user in db .. we basically do jwt.sign(payload , screate_key , exiresin (which is optional))
     // so decoded will contails the payload section .. there it is very comman

     // we set it as req.user .. so that we can make sure that this .. usr is logged in .. thats its .. nothing more+
     //+++ we can also use the same name while showing anything is dashboard .. when the user successfully loggin .. toh 
     // isne indirectly mere .. useParams() hook jaisa hi kaam kardiya .. 

     // +++ signature will be different each time .. when we generate a new kind of token each and every time 

   //  Then the signature might be the same, but usually:

  // JWT automatically adds iat (issued at time) by default

   //iat is current timestamp in seconds

  // Even 1 second difference → signature changes

   // ✅ Very important: call next() to continue to route
    next(); 
      

    }
    catch(error){
       return res.status(400).json({msg:"Invalid or expired token"})
    }

  
 }

 

