import express from "express";
import { getAllTransactionLogController, getCustomerTransactionLogController

 } from "../controllers/transactionLogController.js";

const transactionLogRouter = express.Router();

transactionLogRouter.get("/", getAllTransactionLogController);

transactionLogRouter.get("/customer/:customerId", getCustomerTransactionLogController);

export default transactionLogRouter;