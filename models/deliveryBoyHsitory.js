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

      deliveryBoy : {
        type: mongoose.Schema.Types.ObjectId,   // ✅ FIX
        required: true,
        ref: "DeliveryBoy"
      },
      deliveryStatus : {
        type : String,
        enum : ["pending" , "delivered" , "failed"],
        required : true
      }
    
    }, { timestamps: true }); // this is good enough !!!
    
    const deliveryBoyHistoryModel = mongoose.model("deliveryBoyHistory", dbSchema);
    
    export default deliveryBoyHistoryModel;
