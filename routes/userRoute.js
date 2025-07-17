import express from "express";
import validateRequest from "../middlewares/validateRequest.js";
import {changePasswordSchema} from "../services/validation/userValidation.js";
import receiptRouter from "./receiptRoute.js";
import customerRouter from "./customerRoute.js";
import depositRouter from "./depositRoute.js";


import {
  changePasswordController,
} from "../controllers/userController.js";
import transactionLogRouter from "./transactionLogRoute.js";

const userRouter = express.Router();

userRouter.use("/receipt", receiptRouter);
userRouter.use("/customer", customerRouter);
userRouter.use("/deposit", depositRouter);
userRouter.use("/transaction-log", transactionLogRouter);

userRouter.post("/changePassword",validateRequest(changePasswordSchema), changePasswordController);



export default userRouter;
