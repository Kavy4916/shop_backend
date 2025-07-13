import express from "express";
import validateRequest from "../middlewares/validateRequest.js";
import { validateImage } from "../middlewares/validateImageMiddleware.js";
import {
  createReceiptSchema,
  updateReceiptSchema,
} from "../services/validation/receiptValidation.js";

import {
  createReceiptController,
  getAllReceiptController,
  updateReceiptController,
  getPdfController,
  getReceiptController,
  getRecentReceiptsController,
} from "../controllers/receiptController.js";

const receiptRouter = express.Router();

receiptRouter.post(
  "/create/:customerId",
  validateImage,
  validateRequest(createReceiptSchema),
  createReceiptController
);

receiptRouter.get("/all/:customerId", getAllReceiptController);

receiptRouter.get("/:customerId/:receiptId", getReceiptController);

receiptRouter.get("/recent", getRecentReceiptsController);

receiptRouter.get("/pdf", getPdfController);

receiptRouter.post(
  "/update/:customerId/:receiptId",
  validateImage,
  validateRequest(updateReceiptSchema),
  updateReceiptController
);

export default receiptRouter;
