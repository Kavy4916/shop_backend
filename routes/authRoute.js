import express from "express";
import { login, logout, refresh } from "../controllers/authController.js";
import { userLoginSchema } from "../services/validation/userValidation.js";
import validateRequest from "../middlewares/validateRequest.js";

const authRouter = express.Router();

authRouter.post("/login",validateRequest(userLoginSchema),  login);

authRouter.get("/logout", logout);  

authRouter.get("/refresh", refresh);    

export default authRouter;