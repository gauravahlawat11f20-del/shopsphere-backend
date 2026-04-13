import mongoose from "mongoose";

const  dbSchema  = mongoose.Schema({
    productName : {
        type : String,
        required : true
    },
    owner : {
       type : mongoose.Schema.Types.ObjectId,
       required : true,
       ref: "User"
    },
      price : {
        type : Number,
        required : true
    },
      store : {
        type : String,
        required : true
    },
    category: {
      type: String,
      default: "General"
    },
      quantity : {
        type : Number,
        required : true
    },
      description : {
        type : String,
        required : true
    },
    img : {
      type:String,
      required : true
    }
}, { timestamps: true })

const productByOwnerModel = mongoose.model("productCreatedByOwner" , dbSchema)

export default productByOwnerModel;
