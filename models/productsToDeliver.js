
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

     order_id: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "orderedProducts",
       required: true
     },
    assignedDeliveryBoy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null
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

const productsToDeliverModel = mongoose.model("productsToDeliver" , dbSchema );

export default productsToDeliverModel;
