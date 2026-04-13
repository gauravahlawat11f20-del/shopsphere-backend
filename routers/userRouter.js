import express from "express"
import { addOwnerProduct, addToWishlist, Cartproducts, checkAllowance, checkCart, deleteProductInCart, getOwnerProduct, getUserSummary, getWishlist, loginUser, logout, order, recentOrders, recentOrdersForUser, refreshUserToken, registerUser, removeFromWishlist, sellerStats, setProduct, showAllProducts, updateCart, updateOwnerProductQuantity, updateProfile, visitCart } from "../controllers/userControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import User from "../models/User.js";

const userRouter = express.Router()
userRouter.post("/register" , registerUser /* name of the controller */) // now fist make the controller
userRouter.post("/login" , loginUser )

userRouter.get("/dashboard", authMiddleware, async(req, res) => {
  console.log(req.user)

   const user = await User.findById(req.user).select("name email img"); // means only send name and email!!1



  // At this point, req.user is available
  res.json({ message: `Welcome user ${user._id}` , obj:user });
});

// save product data to the db
userRouter.post("/setProduct" , setProduct )

// update the profile

userRouter.post("/updateProfile" , authMiddleware , updateProfile )

// noe create a route to added the product by owner 

 userRouter.post("/addProduct" , authMiddleware ,addOwnerProduct )

userRouter.get("/getOwnerProduct", authMiddleware ,getOwnerProduct )
userRouter.post("/updateProductQuantity", authMiddleware , updateOwnerProductQuantity )
userRouter.get("/sellerStats", authMiddleware, sellerStats)

// now route to get all the products

userRouter.get("/showAllProducts" , authMiddleware , showAllProducts)

// route to check if the userr is allowed to sell the prodcuts or not 

userRouter.get("/allowedToSell" , authMiddleware , checkAllowance )

// add to cart now 

userRouter.post("/addToCart" ,authMiddleware , Cartproducts )

// now route for visiting cart

userRouter.get("/visitCart" , authMiddleware , visitCart)

// check the cart

userRouter.get("/checkCart" , authMiddleware , checkCart)

// delete the item from cart   

userRouter.post("/deleteProductInCart" , authMiddleware , deleteProductInCart )

// update the quanity of the cart 

userRouter.post("/updateCart" , authMiddleware , updateCart )

// Order the product     

userRouter.post("/order" , authMiddleware , order)

userRouter.get("/recentOrders" , authMiddleware , recentOrders)
userRouter.get("/myRecentOrders" , authMiddleware , recentOrdersForUser)

// wishlist

userRouter.post("/addToWishlist" , authMiddleware , addToWishlist)
userRouter.post("/removeFromWishlist" , authMiddleware , removeFromWishlist)
userRouter.get("/getWishlist" , authMiddleware , getWishlist)
userRouter.get("/summary" , authMiddleware , getUserSummary)


userRouter.post("/logout" ,authMiddleware, logout )
userRouter.get("/refresh" , refreshUserToken )



export default userRouter ; // kardiya 
