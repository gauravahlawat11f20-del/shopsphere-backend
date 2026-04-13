import { DeliveryBoy } from "../models/deliveryBoyModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import orderedProdctsModel from "../models/orderedproducts.js";
import productsToDeliverModel from "../models/productsToDeliver.js";
import deliveryBoyHistoryModel from "../models/deliveryBoyHsitory.js";
import deliveryBoyNotificationModel from "../models/deliveryBoyNotification.js";
import mongoose from "mongoose";
import blacklistedTokenModel from "../models/BlacklistedTokens.js";

export const registerBoy = async (req,res)=>{
 try{

    const {name,email,phone,vehicleType,password} = req.body;

    if(!name || !email || !phone || !vehicleType || !password){
        return res.status(400).json({
            message:"All fields are required"
        })
    }

    const existingBoy = await DeliveryBoy.findOne({email});

    if(existingBoy){
        return res.status(400).json({
            message:"Delivery boy already exists"
        })
    }

    const hashedPassword = await bcrypt.hash(password,10);

    const boy = await DeliveryBoy.create({
        name,
        email,
        phone,
        vehicleType,
        password:hashedPassword
    })

    const token = jwt.sign(
        {id:boy._id},
        process.env.SECRET_KEY || process.env.JWT_SECRET,
        {expiresIn:"7d"}
    )

    return res.status(201).json({
        message:"Delivery boy registered successfully",
        token,
        boy
    })

 }catch(error){
    res.status(500).json({
        message:error.message
    })
 }
}

// create the login .. function there

export const loginBoy = async (req,res)=>{
 try{

    const {email,password} = req.body;

    const boy = await DeliveryBoy.findOne({email});

    if(!boy){
        return res.status(404).json({
            message:"Delivery boy not found"
        })
    }

    const isMatch = await bcrypt.compare(password,boy.password);

    if(!isMatch){
        return res.status(400).json({
            message:"Invalid credentials"
        })
    }

    const token = jwt.sign(
        {id:boy._id},
        process.env.SECRET_KEY || process.env.JWT_SECRET,
        {expiresIn:"7d"}
    )

    // token is there ... now set that .. to the cookies 

    res.cookie("deliveryBoyToken", token, {
    httpOnly:true,
    secure: true,
    sameSite: "none",
    maxAge:7*24*60*60*1000
});


    res.status(200).json({
        message:"Login successful",
     //   token, dont send it like that !!!!
     // it is stored in cookies .. 
     // now a boy logins to to dashboard ... make middle ware to verfy the token !!!
        boy
    })

 }catch(error){
    res.status(500).json({
        message:error.message
    })
 }
}

export const deliveryBoyDash = async(req,res)=>{
      try{
        const deliveryBoyid = req.user; // obj consists of ID + role !!!
        if(!deliveryBoyid){
          return res.status(401).json({message:"Unauthorized"})
        }
          // now you can fetch the whole admin details from the DB ... 
          // and send that to the client side 
         const boy = await DeliveryBoy.findOne({
             _id : deliveryBoyid,
            
          }) // got the admin now send that to client
      
          if(!boy){
              return res.status(404).json({message : "i think .. req.user me panga hogya !!1 vaise hona toh nhi chahiye"})
          }
      
          return res.status(200).json({message : "got the boy !" , deliveryBoy : boy})
      }catch(err){
        console.error(err)
        return res.status(500).json({message : "something went wrong with the server !!!"})
      }

}

export const getAllOrders = async(req,res)=>{

    try{
         const deliveryBoyId = req.user;
         if(!deliveryBoyId){
           return res.status(401).json({message:"Unauthorized"})
         }
         const pendingOrder = await productsToDeliverModel.find({
           deliveryStatus : "pending",
           $or: [
             { assignedDeliveryBoy: null },
             { assignedDeliveryBoy: { $exists: false } },
             { assignedDeliveryBoy: deliveryBoyId }
           ]
         }).populate("user_id").populate("product_id").populate("owner_id");
   // now how can i populate the user details and product details there ...


   return res.status(200).json({message : "got the pending orders !" , orders : pendingOrder})
    }catch(err){
        console.error(err)
        return res.status(500).json({message : "something went wrong with the server !!!"})
    }

 

}

export const refreshDeliveryToken = async (req, res) => {
  try {
    const token = req?.cookies?.deliveryBoyToken || req?.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY || process.env.JWT_SECRET);
    const boy = await DeliveryBoy.findById(decoded.id);
    if (!boy) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    const accessToken = jwt.sign(
      { id: boy._id },
      process.env.SECRET_KEY || process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const acceptOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user;
    if(!deliveryBoyId){
      return res.status(401).json({message:"Unauthorized"})
    }
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const updated = await productsToDeliverModel.findOneAndUpdate(
      {
        _id: orderId,
        deliveryStatus: "pending",
        $or: [
          { assignedDeliveryBoy: null },
          { assignedDeliveryBoy: { $exists: false } }
        ]
      },
      { assignedDeliveryBoy: deliveryBoyId },
      { new: true }
    ).populate("user_id").populate("product_id").populate("owner_id");

    if (!updated) {
      return res.status(409).json({ message: "Order already assigned" });
    }

    return res.status(200).json({
      message: "Order accepted",
      order: updated
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const deliveredSuccessfully = async (req, res) => {
  try {
    // 🔐 Better: middleware se lo (secure)
    const deliveryBoyId = req.user;
    if(!deliveryBoyId){
      return res.status(401).json({message:"Unauthorized"})
    }

    const { orderId } = req.body;

    // 1. Validate
    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required",
      });
    }
    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // 2. Get delivery entry (queue wala)
    const deliveryOrder = await productsToDeliverModel.findById(orderId);

    if (!deliveryOrder) {
      return res.status(404).json({
        message: "Order not found in delivery queue",
      });
    }

    if (!deliveryOrder.assignedDeliveryBoy || String(deliveryOrder.assignedDeliveryBoy) !== String(deliveryBoyId)) {
      return res.status(403).json({
        message: "You are not assigned to this order",
      });
    }

    if (deliveryOrder.deliveryStatus !== "pending") {
      return res.status(409).json({
        message: "Order is not in pending state",
      });
    }

    // 3. Actual order nikalo using order_id 🔥
    const orderProduct = await orderedProdctsModel.findById(
      deliveryOrder.order_id
    );

    if (!orderProduct) {
      return res.status(404).json({
        message: "Actual order not found",
      });
    }

    if (orderProduct.deliveryStatus !== "pending") {
      return res.status(409).json({
        message: "Order already processed",
      });
    }

    // 4. Update delivery status in main order
    const updatedOrder = await orderedProdctsModel.findByIdAndUpdate(
      deliveryOrder.order_id,
      { deliveryStatus: "delivered" },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(500).json({ message: "Failed to update order" });
    }

    // 5. Create history record
    await deliveryBoyHistoryModel.create({
      user_id: orderProduct.user_id,
      product_id: orderProduct.product_id,
      deliveryBoy: deliveryBoyId,
      deliveryStatus: "delivered",
    });

    // 6. Remove from delivery queue
    await productsToDeliverModel.findByIdAndDelete(orderId);

    // 7. Fetch updated history
    const historyOfBoy = await deliveryBoyHistoryModel
      .find({ deliveryBoy: deliveryBoyId })
      .populate("user_id")
      .populate("product_id");

    // 8. Response
    return res.status(200).json({
      message: "Order delivered successfully ✅",
      updatedOrder,
      history: historyOfBoy,
    });

  } catch (err) {
    console.error("DELIVERY ERROR:", err);

    return res.status(500).json({
      message: err.message || "Something went wrong on server",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user;
    if(!deliveryBoyId){
      return res.status(401).json({message:"Unauthorized"})
    }
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const deliveryOrder = await productsToDeliverModel.findById(orderId);
    if (!deliveryOrder) {
      return res.status(404).json({ message: "Order not found in delivery queue" });
    }

    if (!deliveryOrder.assignedDeliveryBoy || String(deliveryOrder.assignedDeliveryBoy) !== String(deliveryBoyId)) {
      return res.status(403).json({ message: "You are not assigned to this order" });
    }

    const orderProduct = await orderedProdctsModel.findById(deliveryOrder.order_id);
    if (!orderProduct) {
      return res.status(404).json({ message: "Actual order not found" });
    }

    if (orderProduct.deliveryStatus !== "pending") {
      return res.status(409).json({ message: "Order already processed" });
    }

    await orderedProdctsModel.findByIdAndUpdate(
      deliveryOrder.order_id,
      { deliveryStatus: "cancelled" },
      { new: true }
    );

    await deliveryBoyHistoryModel.create({
      user_id: orderProduct.user_id,
      product_id: orderProduct.product_id,
      deliveryBoy: deliveryBoyId,
      deliveryStatus: "failed",
    });

    await productsToDeliverModel.findByIdAndDelete(orderId);

    const updatedBoy = await DeliveryBoy.findByIdAndUpdate(
      deliveryBoyId,
      { $inc: { cancelCount: 1 } },
      { new: true }
    );

    if (updatedBoy?.cancelCount === 3) {
      await deliveryBoyNotificationModel.create({
        deliveryBoy: deliveryBoyId,
        message: "You have cancelled 3 orders. If you continue, we will have to take action.",
        severity: "warning"
      });
    }

    const historyOfBoy = await deliveryBoyHistoryModel
      .find({ deliveryBoy: deliveryBoyId })
      .populate("user_id")
      .populate("product_id");

    return res.status(200).json({
      message: "Order cancelled",
      history: historyOfBoy,
      cancelCount: updatedBoy?.cancelCount || 0
    });
  } catch (err) {
    console.error("CANCEL ERROR:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const deliveryBoyId = req.user;
    if(!deliveryBoyId){
      return res.status(401).json({message:"Unauthorized"})
    }
    const notifications = await deliveryBoyNotificationModel
      .find({ deliveryBoy: deliveryBoyId })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      message: "notifications fetched",
      notifications
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    const deliveryBoyId = req.user;
    if(!deliveryBoyId){
      return res.status(401).json({message:"Unauthorized"})
    }
    await deliveryBoyNotificationModel.updateMany(
      { deliveryBoy: deliveryBoyId, read: false },
      { $set: { read: true } }
    );

    return res.status(200).json({ message: "notifications marked as read" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const history = async(req,res) =>{


  try{
    const deliveryBoyid = req.user;
    if(!deliveryBoyid){
      return res.status(401).json({message:"Unauthorized"})
    }
    const history = await deliveryBoyHistoryModel.find({deliveryBoy : deliveryBoyid}).populate("user_id").populate("product_id");
    return res.status(200).json({message : "got the history !" , history : history})
  }catch(err){
    console.error(err)
    return res.status(500).json({message : "something went wrong with the server !!!"})
  }
}

export const logoutDeliveryBoy = async(req,res)=>{
  try{
    const token = req?.cookies?.deliveryBoyToken || req?.headers?.authorization?.split(" ")[1];

    if(!token){
      return res.status(400).json({message : "token nahi hai!!!"})
    }

    const expSeconds = req.tokenExp || Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    await blacklistedTokenModel.create({
      ExpiredToken: token,
      ExpiredAt :  new Date(expSeconds * 1000)
    });

    res.clearCookie("deliveryBoyToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    return res.status(200).json({message : "logout successfull!!"});
  }catch(error){
    return res.status(400).json({message : "something went wrong!!!"});
  }
}
