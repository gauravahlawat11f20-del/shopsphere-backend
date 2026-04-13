
import mongoose from "mongoose";

const dbSchema = mongoose.Schema({
    user_id: {
       type: mongoose.Schema.Types.ObjectId,
       required: true,
       ref : "User"
     },
   
     product_id: {
       type: mongoose.Schema.Types.ObjectId,   // ✅ FIX
       required: true,
       ref: "productCreatedByOwner" // the owner product .. mtlab jisne add kiya hai .. means ye product .. official kahan registered hai
     },

     owner_id: {
       type: mongoose.Schema.Types.ObjectId,
       required: true,
       ref: "User"
     },

   
   
     quantity: {
       type: Number,
       required: true
     },
     totalPrice : {
        type:Number,
        required:true
     },
     deliveryStatus : {
       type : String,
       enum : ["pending" , "delivered" , "cancelled"],
       default:"pending"
     },
     paymentMethod : {
       type : String,
       enum : ["COD" , "UPI" , "CARD"],
       required:true
     }
}, { timestamps: true })

const orderedProdctsModel = mongoose.model("orderedProducts" , dbSchema );

export default orderedProdctsModel;
