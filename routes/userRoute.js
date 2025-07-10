import express from "express";
import { processImage } from "../middlewares/processImageMiddleware.js";
import {
  changePassword,
  createCustomer,
  lastEditedCustomers,
  allCustomers,
  getCustomerDetail,
  createReceipt,
  getFile,
  updateCustomer,
  getAllReceipts,
  getReceipt,
  getAllDeposits,
  createDeposit,
  updateReceipt
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/changePassword", changePassword);
userRouter.post("/customer/create", createCustomer);
userRouter.get("/customer/lastUpdated", lastEditedCustomers);
userRouter.get("/customer/all", allCustomers);
userRouter.get("/customer/detail/:_id", getCustomerDetail);
userRouter.post("/customer/create/receipt/:_id", processImage, createReceipt);
userRouter.get("/file/get", getFile);
userRouter.get("/customer/receipt/all/:_id", getAllReceipts);
userRouter.post("/customer/update/:_id", updateCustomer);
userRouter.get("/customer/receipt/:customerId/:receiptId", getReceipt);
userRouter.get(
  "/customer/receipt/deposit/all/:customerId/:receiptId",
  getAllDeposits
);
userRouter.post(
  "/customer/receipt/deposit/create/:customerId/:receiptId",
  createDeposit
);
userRouter.post(
  "/customer/receipt/update/:customerId/:receiptId",
  processImage,
  updateReceipt
);

export default userRouter;
