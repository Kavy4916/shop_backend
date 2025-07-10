import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./utils/db.js";
import authRouter from "./routes/authRoute.js";
import userRouter from "./routes/userRoute.js";
import authenticateToken from "./middlewares/authMiddleware.js";
import path from "path";


//code 400 or 500 show error message to user
//code 403 logout user
//code 401 access token expired or show message to user
//code 404 show 404 error page with message and redirect to home page

dotenv.config();

const app = express();
const FRONTEND = process.env.FRONTEND || "http://localhost:3000";

// ✅ Proper CORS setup
app.use(cors({
  origin: FRONTEND,
  credentials: true,
}));

// ✅ Required middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Routes
app.use("/api/auth", authRouter);
app.use(authenticateToken);
app.use("/api/secure/user", userRouter);

await connectDB();

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
