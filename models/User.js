import mongoose from "mongoose";

const userSchema = new mongoose.Schema( // schema is a rule book .. tells mongoDB how a user should look
  {
    name:{
        type:String,
        required: true
    },
    email:{
       type:String,
       required:true,
       unique:true
    },
    password:{
        type:String,
        required:true,
    },
    img :{
        type:String
    },
    role:{
        type:String,
        enum : ["user" , "vendor" , "admin"],
        required : true,
        default : "user"
    },
    sellerStatus : {
        type:String,
        enum : ["pending" , "approved" , "rejected"],
        default : "pending" //  remove the default from there .. 
        // and in the react where you are registering the vencdor ... send .. sellerstatus from there as s pending 
        // it will look more real .. 
        // ab toh ... admin register maar .. raha .. hai . to bhi .. seller status .. dikh raha .. hai !!!
    } // seller have to fill it .. 
    // now .. just ... set that ... at default !!!!
    },
   { timestamps: true }
)

const User = mongoose.model("User" , userSchema) // now you can create users ..

export default User;
