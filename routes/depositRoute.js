import express from "express";
import validateRequest from "../middlewares/validateRequest.js";
import {
  createDepositController,
  createDepositWithReceiptIdController,
  getAllDepositWithReceiptIdController,
  getRecentDepositsController,
  getDepositWithReceiptIdController,
  updateDeppositWithReceiptIdController,
  deleteDepositWithReceiptIdController
} from "../controllers/depositController.js";
import {
  createDepositWithReceiptIdSchema,
  createDepositSchema,
  updateDepositWithReceiptIdSchema,
} from "../services/validation/depositValidation.js";
import deposit from "../models/deposit.js";

const depositRouter = express.Router();

depositRouter.post(
  "/create/receipt/:customerId/:receiptId",
  validateRequest(createDepositWithReceiptIdSchema),
  createDepositWithReceiptIdController
);

depositRouter.post(
  "/create/:customerId",
  validateRequest(createDepositSchema),
  createDepositController
);

depositRouter.get("/:customerId/:receiptId/:depositId", getDepositWithReceiptIdController );


depositRouter.get("/recent", getRecentDepositsController);
depositRouter.get("/all/receipt/:customerId/:receiptId", getAllDepositWithReceiptIdController);
depositRouter.put("/update/receipt/:customerId/:receiptId/:depositId", validateRequest(updateDepositWithReceiptIdSchema), updateDeppositWithReceiptIdController);
depositRouter.delete("/delete/receipt/:customerId/:receiptId/:depositId", deleteDepositWithReceiptIdController);

export default depositRouter;
