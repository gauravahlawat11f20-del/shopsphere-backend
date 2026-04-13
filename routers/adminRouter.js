import express from "express"
import { acceptOrReject, adminDash, getAdminDashboardStats, getDeliveryBoyCancellations, getTheSeller, loginAdmin, logout, refreshAdminToken, registerAdmin } from "../controllers/adminControllers.js";
import {body} from "express-validator"
import authMiddlewareForAdmin from "../middlewares/authMiddlewareForAdmin.js";

const adminRouter = express.Router() // router create kiya with the help of express
// now you can create .. just simple as that 

adminRouter.post("/register" , 
    //  now create validation system there 
    [
    body("name").notEmpty().withMessage("name is required !!!") ,
    body("email").isEmail().withMessage("Valid email required !!!"),
    body("password").isLength({min : 3}).withMessage("password must be 3 characters")
    ] // done like that .. and if ... any function throws ===> false .. controll will go to the next ... function .. after the middleware 
    // and there we can see what is wrong with our req.body ===> admin input credential !!1 done !!!
    ,registerAdmin )

    // login route 

    adminRouter.post("/login" , [
        body("email").isEmail().withMessage("invalid email !"),
        body("password").isLength({min : 3}).withMessage("password must be of 3 characters !")
    ]  , loginAdmin)

    // now dashboard time

    adminRouter.get("/dash" , authMiddlewareForAdmin , adminDash)
    // in this we just have make another middleware that verifies .. that the token stored in cookie either header 
    //after usr login is correct 
    //and we will check whether the token is created by the signature of the secret key stored in .env folder 
    // look .. if the token is created by us or by the scret key ... the verify function will simply return ==> the user id 
    // if user id is there .. we can say that ,,,, the token is created our secret key !!!

    // now the ain thiking mode error is ==> are we doin this to prevent ==> the hacker or unauthoirzed person .. to access the dashboard 
    // without logining !!!! 
    // and if thats the case the user have to login to access the dashboard !!!
    // if he dosent .. or try to get the dashboard by the route ... we cant ... hahah nice 

    adminRouter.get("/logout" , authMiddlewareForAdmin , logout)
    adminRouter.get("/refresh" , refreshAdminToken)
   // look the verification is still important there ... what if someone git the direct route to logout !!!1
   // pehli baat toh uske paas token hoga hi nhi ... but still manlo token mil gaye 
   // then jwt.verify .. kis din kaam ayega ,,, dekho ki voh token ussi key se geenrated hai .. agar hia 
   // toh allow user to logout ... else ... kon hai be tu logout karne wala .. pehle login toh karle !!!

    // tell me why blacklisting the token is necessary after logout ===> cuz what if the hacker got the token ... 
    // got the access to the dashboard ... but how can a hacker .. get my token ... if i didnt loged out 
    // we will try to find that out ==> after some time .. but first ... do this !!!

    // idea is with token will have to expired in 7 days .. and we logout in 1hour .. 
    // hacker can steal this and access our dashboard if we dont .. mention to restrict the user if the token is already blacklisted !!!
    // if the token is blacklisted ... hacker dashboard access nhi kar sakta .. usko ... verification step par hi hum bhar phenk dnege !!!

    adminRouter.get("/getTheSeller" , authMiddlewareForAdmin , getTheSeller)

    // route to reject or accept the vendor 

    adminRouter.post("/acceptOrReject" , authMiddlewareForAdmin , acceptOrReject )

    adminRouter.get("/deliveryBoyCancellations", authMiddlewareForAdmin, getDeliveryBoyCancellations)

    adminRouter.get("/stats", authMiddlewareForAdmin, getAdminDashboardStats)
    

export default adminRouter; // export karo !!!
