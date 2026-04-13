import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";

import userRouter from "./routers/userRouter.js";
import adminRouter from "./routers/adminRouter.js";
import connectDB from "./config/db.js";

import http from "http"; // cuz we can only use socket for real time ... thing

import { Server } from "socket.io";
import deliveryBoyRouter from "./routers/deliveryBoyRouter.js";
import rateLimit from "express-rate-limit";



// Load env variables
dotenv.config();

// Connect Database
connectDB();

const app = express();

const server = http.createServer(app)

app.disable("x-powered-by");
app.set("trust proxy", 1);

// socket server

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const ALLOWED_ORIGINS = [
  CLIENT_ORIGIN,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001"
];

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://shopsphere-frontend-miau.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


// ================== MIDDLEWARES ==================

// CORS (frontend allowed)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://shopsphere-frontend-miau.vercel.app"
  ],
  credentials: true
}));

// ? BODY PARSER (MUST come before routes)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Cookies
app.use(cookieParser());

// ================== RATE LIMITS ==================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts, please try again later."
});


// ================== CLOUDINARY CONFIG ==================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// ================== ROUTES ==================

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running ??");
});

// Auth rate limits
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/register", authLimiter);
app.use("/api/deliveryBoy/login", authLimiter);
app.use("/api/deliveryBoy/register", authLimiter);

// User routes
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/deliveryBoy" , deliveryBoyRouter )


// ================== SERVER ==================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port 5000");
});

export { io };
