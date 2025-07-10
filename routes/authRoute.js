import { login, logout, refresh } from "../controllers/authController.js";
import express from "express";
const authRouter = express.Router();

authRouter.post("/login", login);

authRouter.get("/logout", logout);  

authRouter.get("/refresh", refresh);    

export default authRouter;