import mongoose from "mongoose"; // remember

const blacklistedSchema = mongoose.Schema({
    ExpiredToken : {
        type : String,
        required : true,
    },
    ExpiredAt:{
        type : Date,
        required : true,
         index: { expires: 0 } // 🔥 TTL
         // when the expire date hits .. hit got deleted !!
    }
})

const blacklistedTokenModel = mongoose.model("blackListedTokens",  blacklistedSchema ) // model created successfully

export default blacklistedTokenModel;



