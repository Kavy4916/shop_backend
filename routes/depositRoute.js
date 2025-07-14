import express from "express";
import validateRequest from "../middlewares/validateRequest.js";
import {
  createDepositController,
  createDepositWithReceiptIdController,
  getAllDepositWithReceiptIdController,
  getRecentDepositsController,
  getDepositWithReceiptIdController,
  updateDeppositWithReceiptIdController,
  deleteDepositWithReceiptIdController,
  getAllUnsettledDepositController,
  getDepositController,
  settleDepositController,
  updateDepositController,
  deleteDepositController,
  removeDepositController
} from "../controllers/depositController.js";
import {
  createDepositWithReceiptIdSchema,
  createDepositSchema,
  updateDepositWithReceiptIdSchema,
  updateDepositSchema,
  settleDepositSchema,
  deleteDepositSchema,
  getUnsettledDepositSchema,
  getAllDepositWithReceiptIdSchema
} from "../services/validation/depositValidation.js";

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
depositRouter.get("/get/:customerId/:depositId", validateRequest(deleteDepositSchema), getDepositController);
depositRouter.get(
  "/unsettled/all/:customerId",
  validateRequest(getUnsettledDepositSchema),
  getAllUnsettledDepositController
);
depositRouter.get(
  "/get/:customerId/:receiptId/:depositId",
  validateRequest(settleDepositSchema),
  getDepositWithReceiptIdController
);
depositRouter.get("/recent", getRecentDepositsController);
depositRouter.get(
  "/all/receipt/:customerId/:receiptId",
  validateRequest(getAllDepositWithReceiptIdSchema),
  getAllDepositWithReceiptIdController
);
depositRouter.put(
  "/settle/:customerId/:receiptId/:depositId",
  validateRequest(settleDepositSchema),
  settleDepositController
);
depositRouter.put(
  "/update/receipt/:customerId/:receiptId/:depositId",
  validateRequest(updateDepositWithReceiptIdSchema),
  updateDeppositWithReceiptIdController
);
depositRouter.put(
  "/update/:customerId/:depositId",
  validateRequest(updateDepositSchema),
  updateDepositController
)
depositRouter.put(
  "/remove/:customerId/:receiptId/:depositId",
  validateRequest(settleDepositSchema),
  removeDepositController
)
depositRouter.delete(
  "/delete/:customerId/:depositId",
  validateRequest(deleteDepositSchema),
  deleteDepositController
);
depositRouter.delete(
  "/delete/receipt/:customerId/:receiptId/:depositId",
  validateRequest(settleDepositSchema),
  deleteDepositWithReceiptIdController
);

export default depositRouter;
