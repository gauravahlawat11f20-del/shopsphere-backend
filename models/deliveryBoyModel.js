import mongoose from "mongoose";

const deliveryBoySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    phone:{
        type:String,
        required:true
    },
    vehicleType:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    isAvailable:{
        type:Boolean,
        default:true
    },
    cancelCount:{
        type:Number,
        default:0
    }
},{timestamps:true})

export const DeliveryBoy = mongoose.model("DeliveryBoy",deliveryBoySchema);
