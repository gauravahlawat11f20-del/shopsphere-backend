import mongoose from "mongoose";

const dbSchema = mongoose.Schema({
    productName : {
      type:String,
      required : true
    },
    quantity:{
       type:Number,
      required : true
    },
    price:{
      type:String,
      required : true
    },
    owner:{
      type:String,
      required : true
    }
})

const productModel = mongoose.model("products" , dbSchema);

export default productModel;