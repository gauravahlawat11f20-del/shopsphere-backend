import jwt from "jsonwebtoken"


const generateToken =(userID)=>{

    // now create a fresh token there

    return jwt.sign(
      {ID :  userID } ,
      process.env.SECRET_KEY,
      {expiresIn : "7d"}
    );
   // we are done from there .. i think 

}
// simpleexpalantion ==? 
//if u wnna make a app in which .. u want to just login the use right aftr he registered his credentials for the first time 
// example ===> registers ===> logined automatically 
// then in that case .. generate a token after register 

// and if you want the user .. to type his craedentials .. even after he filled ..theme after register 
// then the basic world wide appraoch . to to genreate the toke affter login .. is moe better . 

// so basically its all about .. how u want the user to ge loggined 


export default generateToken;