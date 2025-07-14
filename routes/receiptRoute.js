import express from "express";
import validateRequest from "../middlewares/validateRequest.js";
import { validateImage } from "../middlewares/validateImageMiddleware.js";
import {
  createReceiptSchema,
  updateReceiptSchema,
  getAllReceiptSchema,
  deleteReceiptSchema,
  pdfSchema
} from "../services/validation/receiptValidation.js";

import {
  createReceiptController,
  getAllReceiptController,
  updateReceiptController,
  getPdfController,
  getReceiptController,
  getRecentReceiptsController,
  deleteReceiptController,
} from "../controllers/receiptController.js";

const receiptRouter = express.Router();

receiptRouter.post(
  "/create/:customerId",
  validateImage,
  validateRequest(createReceiptSchema),
  createReceiptController
);

receiptRouter.get("/all/:customerId", validateRequest(getAllReceiptSchema), getAllReceiptController);

receiptRouter.get("/:customerId/:receiptId", validateRequest(deleteReceiptSchema), getReceiptController);

receiptRouter.get("/recent", getRecentReceiptsController);

receiptRouter.get("/pdf",validateRequest(pdfSchema), getPdfController);

receiptRouter.post(
  "/update/:customerId/:receiptId",
  validateImage,
  validateRequest(updateReceiptSchema),
  updateReceiptController
);

receiptRouter.delete(
  "/delete/:customerId/:receiptId",
  validateRequest(deleteReceiptSchema),
  deleteReceiptController
);

export default receiptRouter;
