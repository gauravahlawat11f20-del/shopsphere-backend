import { Router } from "express"; // router is imported 
import express from "express"
import { acceptOrder, cancelOrder, deliveredSuccessfully, deliveryBoyDash, getAllOrders, getNotifications, history, loginBoy, logoutDeliveryBoy, markNotificationsRead, refreshDeliveryToken, registerBoy } from "../controllers/deliveryBoyControllers.js";
import { authMiddlewareForDeliveryBuy } from "../middlewares/authzMiddlewareForDeliveryBoy.js";

const deliveryBoyRouter = express.Router(); // there it is imported !!!

deliveryBoyRouter.post("/register" , registerBoy ); // route created!!

deliveryBoyRouter.post("/login" , loginBoy)

deliveryBoyRouter.get("/dash" , authMiddlewareForDeliveryBuy , deliveryBoyDash )

deliveryBoyRouter.get("/getAllOrders" , authMiddlewareForDeliveryBuy , getAllOrders )
deliveryBoyRouter.post("/acceptOrder" , authMiddlewareForDeliveryBuy , acceptOrder )

deliveryBoyRouter.post("/deliveredSuccessfully" , authMiddlewareForDeliveryBuy , deliveredSuccessfully )
deliveryBoyRouter.post("/cancelOrder" , authMiddlewareForDeliveryBuy , cancelOrder )
deliveryBoyRouter.get("/notifications" , authMiddlewareForDeliveryBuy , getNotifications )
deliveryBoyRouter.post("/notifications/read" , authMiddlewareForDeliveryBuy , markNotificationsRead )
deliveryBoyRouter.get("/refresh", refreshDeliveryToken)

deliveryBoyRouter.get("/history" , authMiddlewareForDeliveryBuy , history)
deliveryBoyRouter.get("/logout" , authMiddlewareForDeliveryBuy , logoutDeliveryBoy)

export default deliveryBoyRouter;
