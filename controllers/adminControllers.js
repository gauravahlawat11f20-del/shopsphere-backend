import { validationResult } from "express-validator";
import User from "../models/User.js";
import { hash } from "bcrypt";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken";
import generateToken from "../utils/generateToken.js";
import blacklistedTokenModel from "../models/BlacklistedTokens.js";
import { generateAccessToken } from "../utils/generateAccessToken.js";
import { DeliveryBoy } from "../models/deliveryBoyModel.js";
import deliveryBoyNotificationModel from "../models/deliveryBoyNotification.js";
import productByOwnerModel from "../models/ProductAddedByOwnerModel.js";
import orderedProdctsModel from "../models/orderedproducts.js";


export const registerAdmin = async(req,res)=>{

    const errors = validationResult(req);

    if(!errors.isEmpty()) // mtlab error aya hai 
    {
            return res.status(400).json({message : "credentials are wrong !!!" , error : errors.array()})
    } // this part is done .. and it was so easy to understand for even a beginner !!1


    try{


    const {name , email , password} = req.body;
    // got that credentails !!!
    const role = "admin"

   // create a model and push obj into DB !!
   // mai kahta hoon ki same db collection use karte hain ..
   // lets chatgpt this part ... and 

   // wait wait wait /
   // what if same admin do bar register ho gaye ?/

   const isThere = await User.findOne({
    email : email,
    role : role // i think i am stroing the role as admin .. but 
   })

   if(isThere){
    return res.status(401).json({message : "same admin has already registered !!!"})
   }

   // this part is done .. now send the encrypted password to the db

   const saltRounds = 10; // kitni bar mixing chahiye password ki 
   const hashedPassword =await hash(password , saltRounds);
   // i think this is thing !!!

  const adminRegistered = await User.create({
    name,
    email,
    password : hashedPassword,
    role // but it is pushing .. user there
   })

   return res.status(201).json({message : "admin has been registered successfully !" , admin : adminRegistered._id})
   // okay i used 201 .. does it mean .. this code will run till the last ????
   // simply it will not gonna be the last  line of the code ???
   // hogyaa !!

   // yes i have done it .. and now its time to maove to .. login the admin part 
   // where we gonna do ... main things like ==> check if the admin is correct
}catch(error){
    return res.status(500).json({message : "something went wrong !!!"})
}
    

} // function in controller has been creates !!!

// login function 
export const loginAdmin = async(req,res)=>{
    // jobs to do 
    // ===>> get the body .. and check if the admin exists
    // if he done == > match the password 
    // ==> is password matches ===> create token and send that to client side browser mainly ==> cookies !!!

    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({message : "invalid input" , error : errors.array() })
    } // validation is done 

    try{

    const {email , password} = req.body;

    // now fetch the data

    const foundAdmin = await User.findOne({
        email : email
    })

    if(foundAdmin){
      // match the passsword first 
      const hashedPassword = foundAdmin.password;
     const matched = await bcrypt.compare(password , hashedPassword);
     if(matched){ // if password matches
       console.log("password matches !!!")
       // now just generate a token and send that to client side !!!
       const token =  generateToken(foundAdmin._id) // id pass ke ab sike badle
       const accessToken = generateAccessToken(foundAdmin._id , foundAdmin.role)
       // now just send that token to the cookie // 
       // adn yes we generated 2 token .. the rrefrs cookie .. should be stored in the cookie and the access token .. 
       // will be genrated by the refresh token ... after every 15 mins .. and siliently passed to the server ... 
        // ✅ SET COOKIE PROPERLY
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
     });

      return res.status(200).json({message : "FOUND + PASSWORD is also correct!!!" , user:foundAdmin._id , JWTToken : token , accessToken : accessToken , role:foundAdmin.role})
     
     }else{ // if password doesnt
       return res.status(400).json({message : "password is incorrect !!!"})
     }
    }else{
        return res.status(404).json({message : "admin not found !!!"})
    }

}catch(error){
    console.error(error)
    return res.status(500).json({message : "server related error has been occured !!!"})
}
}

export const refreshAdminToken = async (req, res) => {
  try {
    const token = req.cookies?.adminToken || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY || process.env.JWT_SECRET);
    const admin = await User.findById(decoded.ID).select("role");
    if (!admin || admin.role !== "admin") {
      return res.status(404).json({ message: "Admin not found" });
    }

    const accessToken = generateAccessToken(decoded.ID, admin.role);
    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// dashboard
export const adminDash = async(req,res)=>{
    const adminid = req.user; // obj consists of ID + role !!!
    // now you can fetch the whole admin details from the DB ... 
    // and send that to the client side 
   const admin = await User.findOne({
       _id : adminid.ID,
       role : adminid.role
    }) // got the admin now send that to client

    if(!admin){
        return res.status(404).json({message : "i think .. req.user me panga hogya !!1 vaise hona toh nhi chahiye"})
    }

    return res.status(200).json({message : "got the admin !" , admin : admin})
}

//logout
export const logout=async(req,res)=>{
    // get the token first .. and then blacklist it 
    const token = req.cookies?.adminToken || req.headers?.authorization?.split(" ")[1];

     if(!token){
           // pehli baat toh hoga hi hoga agar yahan tk contol gaya hai toh
           return res.status(400).json({msg : "token nahi hai!!!"})
         }
   
         // token mil gaya ... ab chadha do .. db me
   
         console.log("this : " + req.user)
   
        const expSeconds = req.tokenExp || Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
        const blckToken = await blacklistedTokenModel.create({
             ExpiredToken: token,
             ExpiredAt :  new Date(expSeconds * 1000)
         })  // token gaya ... db ke andar !!

         // now remove that token from cookies

           res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  }); // token is removed from the cookie !!1


      return res.status(200).json({message : "token is stored successfully + removed from the cookie + logout successfull!!"})
}

// get the seller .. which have sellerStatus as pending .. only 

export const getTheSeller = async(req,res) =>{
  // write the code here .. for getting the user ... where .. role is vendor .. and sellerStatus is pending 
  // the name of the moduel is User .. 
    try {

    // find all vendors whose approval is still pending
    const sellers = await User.find({
      role: "vendor",
      sellerStatus: "pending"
    });

    res.status(200).json({
      success: true,
      sellers
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch seller requests",
      error: error.message
    });
  }
} // i think this is perfect yrr .. so now what is lacking !!

// accept or reject 
export const acceptOrReject = async (req, res) => {
  try {

    const { id, operation } = req.body;

    // validate operation
    if (operation !== "approved" && operation !== "rejected") {
      return res.status(400).json({
        message: "Invalid operation"
      });
    }

    // find vendor
    const vendor = await User.findOne({
      _id: id,
      role: "vendor",
      sellerStatus: "pending"
    });

    console.log(vendor);

    if (!vendor) {
      return res.status(404).json({
        message: "Vendor not found or already processed"
      });
    }

    // update status
    vendor.sellerStatus = operation;

    await vendor.save();

    return res.status(200).json({
      success: true,
      message: `Vendor ${operation} successfully`,
      vendor
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const getDeliveryBoyCancellations = async (req, res) => {
  try {
    const boys = await DeliveryBoy.find({ cancelCount: { $gte: 3 } })
      .select("name email phone vehicleType cancelCount");

    const notifications = await deliveryBoyNotificationModel
      .find({ severity: "warning" })
      .populate("deliveryBoy", "name email")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      deliveryBoys: boys,
      notifications
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsersPromise = User.countDocuments({ role: { $ne: "admin" } });
    const totalProductsPromise = productByOwnerModel.countDocuments();
    const totalOrdersPromise = orderedProdctsModel.countDocuments();
    const inventoryAggPromise = productByOwnerModel.aggregate([
      {
        $group: {
          _id: null,
          inStockCount: {
            $sum: {
              $cond: [{ $gt: ["$quantity", 0] }, 1, 0]
            }
          },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ["$quantity", 5] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalSalesAggPromise = orderedProdctsModel.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const topProductsPromise = orderedProdctsModel.aggregate([
      { $group: { _id: "$product_id", orderCount: { $sum: 1 } } },
      { $sort: { orderCount: -1 } },
      { $limit: 6 },
      {
        $lookup: {
          from: "productcreatedbyowners",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          orderCount: 1,
          name: "$product.productName"
        }
      }
    ]);
    const recentOrdersPromise = orderedProdctsModel
      .find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate("user_id", "name")
      .populate("product_id", "productName")
      .select("totalPrice deliveryStatus createdAt");

    const [totalUsers, totalProducts, totalOrders, totalSalesAgg, topProducts, recentOrders, inventoryAgg] = await Promise.all([
      totalUsersPromise,
      totalProductsPromise,
      totalOrdersPromise,
      totalSalesAggPromise,
      topProductsPromise,
      recentOrdersPromise,
      inventoryAggPromise
    ]);

    const totalSales =
      Array.isArray(totalSalesAgg) && totalSalesAgg.length > 0
        ? totalSalesAgg[0].total
        : 0;
    const inventory = Array.isArray(inventoryAgg) && inventoryAgg.length > 0
      ? inventoryAgg[0]
      : { inStockCount: 0, lowStockCount: 0 };

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalSales,
        topProducts: Array.isArray(topProducts) ? topProducts : [],
        inventory: {
          inStockCount: inventory.inStockCount || 0,
          lowStockCount: inventory.lowStockCount || 0
        },
        recentOrders: Array.isArray(recentOrders)
          ? recentOrders.map((order) => ({
              id: order._id,
              customer: order.user_id?.name || "Unknown",
              product: order.product_id?.productName || "Unknown product",
              status: order.deliveryStatus || "pending",
              total: order.totalPrice || 0
            }))
          : []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
