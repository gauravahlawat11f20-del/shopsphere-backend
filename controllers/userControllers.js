import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import blacklistedTokenModel from "../models/BlacklistedTokens.js";
import productModel from "../models/storeProduct.js";
import { json } from "express";
import {v2 as cloudinary} from "cloudinary"; // now use it therer ..
import bcrypt from "bcrypt";
import productByOwnerModel from "../models/ProductAddedByOwnerModel.js";
import usersAddToCartModel from "../models/usersAddToCart.js";
import { io } from "../index.js";

import { Socket } from "socket.io";
import orderedProdctsModel from "../models/orderedproducts.js";
import { generateAccessToken } from "../utils/generateAccessToken.js";
import wishlistModel from "../models/wishlistModel.js";
import productsToDeliverModel from "../models/productsToDeliver.js";
import mongoose from "mongoose";


export const registerUser = async(req , res)=>{

    try{

      const {name , email , password , role , sellerStatus} = req.body; // destruct kardiya .. body .. ke data ko .. that comes from client side

    if(!name || !email || !password){ // agar ekk bhi nhi hai toh ... true ho jayega
       return res.status(400).json({message:"credentials must be filled !!!"})
    } // for validation 

    const isThereAlready = await User.findOne({email}) // is .. the user with same name is registerd . already .. then 

    if(isThereAlready){
        return res.status(400).json({message:"the user with the same email address is registerd already !!!"})
    }

    // now first bycrypt the password .. an store the encrypted password in the DB

    const saltRounds = 10; // cost factor what ???
    const hashedPassword = await bcrypt.hash(password , saltRounds);
    console.log("Hashed Password:", hashedPassword);


    // if now .. register the user freshly 

    console.log("role is : " + role)

   const registeredUser = await User.create({
        name,
        email,
        password : hashedPassword,
        role : role , // done,
        ...(role === "vendor" && {sellerStatus})
    })

    // return mera yahan hoga 
    return res.status(201).json({"message" : "registered successfully !!!" , user : registeredUser})



    }
    catch(error){ // catch block me bhi return hona chahiye
     console.log( {"message" : error.message})
       return res.status(500).json({
    message: "Server error"
  });
    }

  
} // registeration is finally done and successfull 

// now its time to make .. the logic to login the user 

export const loginUser = async(req,res)=>{
    // now do the logic 
  // first gt the data from req.body 
  // kyaa kyaa lenge .. only .. email + password

  try{
     const {email,password} = req.body;

  // validation 

  if(!email || !password){
    return res.status(400).json({message : "fill credentails are wrong!!!"})
  }

  // fetch the data on the basis of unique element which is email ==> in our case

 const user = await User.findOne({email})

 if(user){ // if found the user .. then check for password

  const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(400).json({message:"password is incorrect !!!"})
    }

    // generate a token here and pass that to front end 

   const token = generateToken(user._id) // done from there

   console.log( "token is  " + token)
  

 // ✅ SET COOKIE PROPERLY
 res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000
});
  // dont know what .. taht .. 3rd things in objects .. koi jaruri cheeze hongi .. mujhe kyaaa

  // generate the access token ther e.. and send that to client side .. where the client set that to the context ... 
  // so that .. all the components wrapped inside the proivder ... can use that ... token !!!!

  const accessToken = generateAccessToken(user._id , user.role) // token is generated

   return res.status(200).json({message : "FOUND + PASSWORD is also correct!!!" , user:user._id , JWTToken : token , accessToken : accessToken, role:user.role})
 }
 else{
   return res.status(400).json({message:"dont found!!"})
 }

  }
  catch(error){
    return res.status(400).json({"error" : "error yahan hai"})
  }

}

// wonderfull work ..
//things to remember ===>

    // dont return the password just compare and then move on !!!

    // now learn what is jwt token .. why we use them in our application 
    // and how to use theme



 /// pushing data to the db

 export const setProduct = async(req,res)=>{

  try{
      const {productName , quantity , price , owner} = req.body;

  if(!productName || !quantity  || !price){
    res.status(400).json({"msg" : "fill all the credential"})
  }

  console.log(owner)

 const product = await productModel.create({
  productName,
  quantity,
  price,
 // owner : name 
 // ye cheez front end se hi milegi.. tujhe ,, daashboad route jab hit hua hai .. 
 // token veriification ke baad .. req,user .. dashboard me hi accessible ... 
  owner
 })



 
  res.status(200).json({message : "data is stored successfully"})

  } catch(error){
    res.status(400).json({message : "something went wrong!!!"})
  }

 


 }

 // update the profile 

 export const updateProfile = async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);
    console.log("REQ USER:", req.user);

    const { name, email, img , password } = req.body;

     console.log("Uploaded URL:", img , name , email);

    let imageUrl = null;

    if (img) {
      console.log("Uploading to Cloudinary...");

      const result = await cloudinary.uploader.upload(img, {
        folder: "profile_images",
      });

      imageUrl = result.secure_url;

      console.log("Uploaded URL:", imageUrl);
    }

    const updatePayload = { name, email, ...(imageUrl && { img: imageUrl }) };

    if (password && password.trim().length > 0) {
      const saltRounds = 10;
      updatePayload.password = await bcrypt.hash(password , saltRounds);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user,
      updatePayload,
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.log("🔥 UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};

// function to add product created by the owner 

export const addOwnerProduct = async (req, res) => {
 try {

   const {productName, store, price, quantity, description, img, category} = req.body;

  // const USER = await User.findById(req.user).select("name");

   const owner = req.user;

   console.log("the owner is : " , owner)

   let imageUrl = null;

   if (img) {
     const result = await cloudinary.uploader.upload(img,{
       folder:"profile_images"
     });

     imageUrl = result.secure_url;
   }

   const addedProduct = await productByOwnerModel.create({
     productName,
     owner,
     store,
     price,
     quantity,
     description,
     ...(category && { category }),
     img: imageUrl
   });

   res.status(200).json({
     message:"product added successfully",
     product:addedProduct
   });

 } catch(error) {

   console.log(error);

   res.status(500).json({
     message:"Server error"
   });

 }
};

// fucntion to get the product from the owner 

export const getOwnerProduct = async(req,res) =>{
//  const {ownerName} = req.body;

try{
const user = req.user;

console.log(user)

console.log("req.user value:", req.user);
console.log("req.user type:", typeof req.user);

 if(!user){
   return res.status(401).json({message : "Unauthorized"})
 }

 const USER = await User.findById(req.user).select("name"); // means only send name and email!!1

 console.log(USER.name)

 const product =  await productByOwnerModel.find({
   $expr: { $eq: [{ $toString: "$owner" }, user?.toString()] }
 })

  console.log(product)

 if(product){
     res.status(200).json({message : " got each and every product !!!" , product:product})
 }else{
  res.status(400).json({message : "dont have any !!!"})
 }
}catch(err){
  console.error(err)
  return res.status(500).json({message : "something went wrong with the server !!!"})
}
}

export const updateOwnerProductQuantity = async (req, res) => {
  try{
    const ownerId = req.user;
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }
    if(!ownerId){
      return res.status(401).json({ message: "Unauthorized" });
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ message: "Quantity must be 0 or more" });
    }

    const product = await productByOwnerModel.findOneAndUpdate(
      {
        _id: productId,
        $expr: { $eq: [{ $toString: "$owner" }, ownerId.toString()] }
      },
      { quantity: qty },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found for this seller" });
    }

    return res.status(200).json({ message: "Quantity updated", product });
  }catch(err){
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export const sellerStats = async (req, res) => {
  try{
    const ownerId = req.user;
    if (!ownerId || !mongoose.isValidObjectId(ownerId)) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

    const ownerMatch = {
      $expr: { $eq: [{ $toString: "$owner_id" }, ownerId.toString()] }
    };
    const productOwnerMatch = {
      $expr: { $eq: [{ $toString: "$owner" }, ownerId.toString()] }
    };

    const [ordersAgg, productsCountRaw] = await Promise.all([
      orderedProdctsModel.aggregate([
      { $match: ownerMatch },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$totalPrice" },
          customers: { $addToSet: "$user_id" }
        }
      },
      {
        $project: {
          _id: 0,
          totalOrders: 1,
          totalSales: 1,
          customersCount: { $size: "$customers" }
        }
      }
      ]),
      productByOwnerModel.countDocuments(productOwnerMatch)
    ]);

    const stats = ordersAgg[0] || { totalOrders: 0, totalSales: 0, customersCount: 0 };

    return res.status(200).json({
      totalOrders: stats.totalOrders,
      totalSales: stats.totalSales,
      productsCount: productsCountRaw || 0,
      customersCount: stats.customersCount
    });
  }catch(err){
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}

export const showAllProducts = async(req,res)=>{
      // now how to access all the products 

      const user_id = req.user;

        console.log("the id is :" + user_id )

     // if(user_id){
        const USER = await User.findOne({_id : user_id})
     // }

     if (!USER) {
       return res.status(404).json({message: "user not found"})
     }

     console.log("the name is :" + USER.name )

      const allProducts = await productByOwnerModel.find({ owner: { $ne: user_id } })

      if(allProducts){
        res.status(200).json({message : "successfully fetched all the products" , products:allProducts})
      }
      else{
         res.status(400).json({message : "something went wrong while fetching!!" })
      }
}

// check 

export const checkAllowance = async(req,res)=>{


  try{

       const user_id = req.user; // the id of the user 

    const seller = await User.findById(user_id);

    if(seller.sellerStatus == "pending"){
      // pending .. so dont allow him toi enter the site 
      res.status(401).json({message : "request is still pending !!!!" , allow : 0})
    }
    else{
       res.status(200).json({message : "yeah you are allowed !!!!" , allow : 1})
    }

  }
  catch(error){
    console.error(error);
    res.status(500).json({message : "something went wrong with the server !!!"})
  }

  
}

// add to cart

export const Cartproducts = async(req,res)=>{ // after user clicked on add to cart
  try {
    const user_id = req.user;
    const {product_id , quantity} = req.body; // id aur quanity le raha hoon 
    // wuanity will be always 1 .. here for that product 
    // now make another model and push .. this product id to that db
    // and check every time when new prouduct id comes .. if this exxists in the db or not .. for the same user 
    // so in our case .. we are sending ... user id and product id again
    // now get the quanity from this
    const product =  await productByOwnerModel.findById(product_id).select("quantity");
    const Avaquantity = product?.quantity;
      // Avaquantity = Number(Avaquantity) - 1
 // but but but .. already have one in db ..  
 // toh directly check yahi call karke maar lenge

 
      if(!product_id || !product){
        return res.status(400).json({message : "product id is not valid !" })
      }

      if (Avaquantity <= 0) {
        return res.status(400).json({message : "Product is out of stock" })
      }

      const existing = await usersAddToCartModel.findOne({ user_id, product_id });
      const currentQty = existing?.quantity || 0;

      if (currentQty + 1 > Avaquantity) {
        return res.status(400).json({message : "Not enough stock available" })
      }

      const productInCart = await usersAddToCartModel.findOneAndUpdate(
        { user_id, product_id },
        { $inc: { quantity: 1 } },
        { new: true, upsert: true }
      );

       // now update .. the count where the quantity is stored 

   // const updated = await productByOwnerModel.findByIdAndUpdate(
 // product_id,
 // { $inc: { quantity: -quantity } }, // here quanity means o selected hai
 // { new: true } // with these .. mongo returned the new updated value .. so this is must 
  // if you odnt include this ... suppose the quan is 10 .. even the qual - 1 .. you will got the same value soo .. thats why 
//);   

 // io.emit("productUpdated", { // now about his .. to commint i guess .. nothing more 
  // send messages to all the connected clients ... sabhi ko chahhe kitne bhi use kar rahe ho
 // product_id,
 // quantity: updated.quantity
 //});  // kuch emit nhi karna yahan pe .. just . kya karo ki .. quantiity lo user se aru db me bhejo 
 // available stock quantity yahan update mtt karo 


      res.status(200).json({message : "saved successfully !" , product : productInCart , quantity : Avaquantity })
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Cart item already exists, please retry" });
    }
    return res.status(500).json({ message: "Server error" });
  }
}

export const refreshUserToken = async (req, res) => {
  try {
    const token = req?.cookies?.token || req?.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY || process.env.JWT_SECRET);
    const user = await User.findById(decoded.ID).select("role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accessToken = generateAccessToken(decoded.ID, user.role);
    return res.status(200).json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// to just check cart .. aur uske base prr .. add to cart button ko . hide and show karenge

export const checkCart = async(req,res)=>{
  const user_id = req.user;
  // now what do i need there 
  // just cart ka data utha .. aur send kar to client 
  const cartProducts = await usersAddToCartModel.find({user_id : user_id}).populate("product_id");

   // ekk kaam karo in stock .. quanity bhi mangooo 

 // const inStocks = await productByOwnerModel.findById(cartProducts.product_id).select("quantity")

  res.status(200).json({message : "all the products added by the" , productsINCart : cartProducts  })
  // now lets check at the client side .. 
  // now the thing is how .. can 
}

// delete the product in the cart 

export const deleteProductInCart = async (req, res) => {
  const user_id = req.user;
  const { product_id } = req.body;

  const deleted = await usersAddToCartModel.deleteOne({
    user_id: user_id,
    product_id: product_id
  });

  if (deleted.deletedCount === 0) {
    return res.status(404).json({
      message: "Product not found in cart"
    });
  }

  res.status(200).json({
    message: "Product deleted successfully",
    result: deleted
  });
};

// update the quanity of the product in the cart

export const updateCart = async(req,res) => {
   const user_id = req.user;
   const {product_id , operation} = req.body; // operation === "increament" || "decreament"

   try{

    const product = await productByOwnerModel.findById(product_id).select("quantity");
    if (!product) {
      return res.status(404).json({message:"product not found"})
    }

    const cartItem = await usersAddToCartModel.findOne({ user_id, product_id });
    if (!cartItem) {
      return res.status(404).json({message:"cart item not found"})
    }

    if(operation == "increment"){
      if (cartItem.quantity + 1 > product.quantity) {
        return res.status(400).json({message:"Not enough stock"})
      }

      const updatedItem = await usersAddToCartModel.updateOne({
          user_id : user_id,
          product_id : product_id
       },
       {
        $inc : {quantity : 1}
       }
      )

      res.status(200).json({message : "increamented successfully !!!" , updateItem:updatedItem})
    }else{
      if (cartItem.quantity <= 0) {
        return res.status(400).json({message:"Quantity cannot go below 0"})
      }

      const updatedItem = await usersAddToCartModel.updateOne({
          user_id : user_id,
          product_id : product_id
       },
       {
        $inc : {quantity : -1}
       }
      )

      res.status(200).json({message : "decreamented successfully !!!" , updateItem:updatedItem})
    }

   }catch(error){
    res.status(400).json({message:"something went wrong !!"})
   }
}

export const visitCart = async(req,res)=>{
  const user_id = req.user;

  const products = await usersAddToCartModel.find({user_id : user_id}).populate("product_id");

  const pure = await usersAddToCartModel.find({user_id : user_id})

  res.status(200).json({message : "got all the item by this user" , products : products , pureProduct : pure})
}

// wishlist

export const addToWishlist = async (req, res) => {
  try {
    const user_id = req.user;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" });
    }

    const existing = await wishlistModel.findOne({ user_id, product_id });
    if (existing) {
      return res.status(200).json({ message: "already in wishlist", item: existing });
    }

    const item = await wishlistModel.create({ user_id, product_id });

    return res.status(201).json({ message: "added to wishlist", item });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const user_id = req.user;
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ message: "product_id is required" });
    }

    const deleted = await wishlistModel.deleteOne({ user_id, product_id });

    if (deleted.deletedCount === 0) {
      return res.status(404).json({ message: "product not found in wishlist" });
    }

    return res.status(200).json({ message: "removed from wishlist" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getWishlist = async (req, res) => {
  try {
    const user_id = req.user;

    const items = await wishlistModel.find({ user_id }).populate("product_id");
    const products = items.map((i) => i.product_id).filter(Boolean);

    return res.status(200).json({ message: "wishlist fetched", products });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserSummary = async (req, res) => {
  try {
    const user_id = req.user;

    const [totalOrders, pendingOrders, wishlistItems] = await Promise.all([
      orderedProdctsModel.countDocuments({ user_id }),
      orderedProdctsModel.countDocuments({ user_id, deliveryStatus: "pending" }),
      wishlistModel.countDocuments({ user_id })
    ]);

    return res.status(200).json({
      message: "summary fetched",
      summary: {
        totalOrders,
        pendingOrders,
        wishlistItems
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const order =async(req,res)=>{
  const user_id = req.user;
  const { paymentMethod } = req.body;

  if (!paymentMethod) {
    return res.status(400).json({message:"paymentMethod is required"})
  }

  const cartItems = await usersAddToCartModel
    .find({ user_id })
    .populate("product_id");

  if (!cartItems || cartItems.length === 0) {
    return res.status(400).json({message:"Cart is empty"})
  }

  const updatedProducts = [];

  try {
    for (const cartItem of cartItems) {
      const productId = cartItem.product_id?._id;
      if (!productId) {
        throw new Error("Product not found");
      }

      const updatedProduct = await productByOwnerModel.findOneAndUpdate(
        { _id: productId, quantity: { $gte: cartItem.quantity } },
        { $inc: { quantity: -cartItem.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error("Not enough stock");
      }

      updatedProducts.push({
        productId,
        quantity: cartItem.quantity
      });

      const finalPrice = Number(updatedProduct.price) * cartItem.quantity;

      const createdOrder = await orderedProdctsModel.create({
        user_id: user_id,
        product_id: updatedProduct._id,
        owner_id: updatedProduct.owner,
        quantity: cartItem.quantity,
        totalPrice: finalPrice,
        paymentMethod: paymentMethod
      });

      await productsToDeliverModel.create({
        user_id: user_id,
        product_id: updatedProduct._id,
        owner_id: updatedProduct.owner,
        order_id: createdOrder._id,
        quantity: cartItem.quantity,
        totalPrice: finalPrice,
        paymentMethod: paymentMethod
      });
    }

    await usersAddToCartModel.deleteMany({ user_id });

    const refreshedProducts = await productByOwnerModel.find();
    io.emit("productsUpdated", refreshedProducts);
    io.emit("socketUpdated", refreshedProducts);

    res.status(200).json({
      message: "Purchased Successfully !!!",
      products: [],
      updatedProducts: refreshedProducts
    });

  } catch (error) {
    // Best-effort rollback of stock updates when running without transactions
    for (const item of updatedProducts) {
      await productByOwnerModel.updateOne(
        { _id: item.productId },
        { $inc: { quantity: item.quantity } }
      );
    }
    return res.status(400).json({ message: error.message });
  }
}

 // show the recent order 

export const recentOrders = async (req, res) => {

  try {

    const sellerId = req.user;

    const orders = await orderedProdctsModel.find({ owner_id: sellerId })

      .populate({
        path: "user_id",
        select: "name"
      })

      .populate({
        path: "product_id",
        select: "productName owner price deliveryStatus"
      })

      .sort({ createdAt: -1 })

      .limit(10);


    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      buyerName: order.user_id?.name,
      productName: order.product_id?.productName,
      ownerName: order.product_id?.owner,
      price: order.totalPrice,
      deliveryStatus : order.deliveryStatus
    })); // trick to learn .. for the future .... 
    // lets go !!!!


    res.status(200).json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};

export const recentOrdersForUser = async (req, res) => {
  try {
    const user_id = req.user;

    const orders = await orderedProdctsModel.find({ user_id })
      .populate({
        path: "product_id",
        select: "productName price"
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      productName: order.product_id?.productName || "Product",
      price: order.totalPrice,
      deliveryStatus: order.deliveryStatus,
      createdAt: order.createdAt
    }));

    return res.status(200).json({
      success: true,
      orders: formattedOrders
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};



    export const logout = async(req,res)=>{

      try{

        // first fetch the token 

      const token = req?.cookies?.token || req?.headers?.authorization?.split(" ")[1]

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
      }) 

      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
      });


      return res.status(200).json({message : "token is stored successfully + removed from the cookie + logout successfull!!"})

    }
      catch(error){
       return res.status(400).json({msg : "something went wrong!!!"})
      }

    

    }


    // about salt runds 
    // look when you pass the saltRounds into the fucntion of bcypt.hash(password , 10)
    // it will gonna create a different hashed password .. each time .. even if the password .. registered by two users are same 
    // only bacause you are not creating the salt manually ..  
    // in case of manual creation the password can be same for sure .. 
    // so i would like to pass the salt rounds to the function directly .... 
