import mongoose, { get } from "mongoose";
import _ from "lodash";
import { customAlphabet } from "nanoid";
import AppError from "../utils/AppError.js";
import createPdf from "../services/pdfCreationService.js";
import {
  uploadPdf,
  permanentDeleteLatestPdf,
  getPdf,
} from "../services/pdfStorageService.js";
import {
  createReceipt,
  getAllReceipt,
  getReceipt,
  getRecentReceipts,
  updateReceipt,
  deleteReceipt,
} from "../services/receiptService.js";
import { createTransactionLog } from "../services/transactionLogService.js";
import { getCustomer } from "../services/customerService.js";
import { getAllDeposit, updateDeposit } from "../services/depositService.js";
import {
  getISTDateString,
  getOldChangesFields,
} from "../utils/utilityFunction.js";

const nanoid = customAlphabet(
  "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  10
);
const createReceiptController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId } = req.params;
    const { date } = req.body;
    const userId = req.userId;
    const files = req.files;
    let pdfPath = null;
    const customer = await getCustomer({ _id: customerId }, "_id", session);
    if (!customer) throw new AppError("Customer not found", 404);
    if (files && files.length > 0) {
      let pdfData = null;
      try {
        pdfData = await createPdf(files);
      } catch (error) {
        throw new AppError(
          error.message || "Server error",
          error.status || 500
        );
      }
      const uniqueId = nanoid();
      const fileName = `${date}_${uniqueId}.pdf`;
      const key = `receipts/${customerId}/${fileName}`;
      try {
        await uploadPdf(key, pdfData);
        pdfPath = key;
      } catch (error) {
        throw new AppError(
          error.message || "Server error",
          error.status || 500
        );
      }
    }

    const receipt = {
      ...req.body,
      customerId,
      receiptUrl: pdfPath, // will be null if no images uploaded
    };
    try {
      const newReceipt = await createReceipt(receipt, session);
      const transactionLog = {
        userId,
        customerId,
        operation: "create receipt",
        entities: [
          {
            type: "Receipt",
            id: newReceipt._id,
            action: "create",
            changes: newReceipt,
          },
        ],
      };
      await createTransactionLog(transactionLog, session);
      await session.commitTransaction();
      res.status(201).json({
        message: "Receipt created successfully",
      });
    } catch (error) {
      if (pdfPath) {
        await permanentDeleteLatestPdf(pdfPath);
      }
      throw new AppError(error.message || "Server error", error.status || 500);
    }
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("Error creating receipt:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const getAllReceiptController = async (req, res) => {
  const { customerId } = req.params;
  try {
    const receipts = await getAllReceipt(
      { customerId },
      "_id amount due date",
      { date: -1 }
    );
    res.status(200).json(receipts);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("Error getting receipts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getReceiptController = async (req, res) => {
  const { customerId, receiptId } = req.params;
  try {
    const receipt = await getReceipt(receiptId);
    if (!receipt || receipt.customerId != customerId)
      throw new AppError("Bad request", 400);
    res.status(200).json(receipt);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("Error getting receipt:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getPdfController = async (req, res) => {
  const key = req.validated.receiptUrl;
  try {
    const s3Stream = await getPdf(key);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");
    s3Stream.pipe(res);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("Error getting pdf:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateReceiptController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { customerId, receiptId } = req.params;
  const userId = req.userId;
  const { amount } = req.body;
  const files = req.files;
  let pdfPath = null;
  let imageUpload = false;
  try {
    const receipt = await getReceipt(receiptId, null, session);
    let due = receipt.due;
    pdfPath = receipt.receiptUrl;
    if (!receipt || receipt.customerId.toString() !== customerId) {
      throw new AppError("Receipt not found", 404);
    }
    const [old, changes] = getOldChangesFields(receipt, req.body);
    if (_.isEqual(old, {}) && !(files && files.length > 0))
      throw new AppError("No changes", 400);
    if (amount && amount !== receipt.amount) {
      due = receipt.due + (amount - receipt.amount);
      if (due < 0) throw new AppError("Due can't be negative", 400);
    }
    if (files && files.length > 0) {
      let pdfData = null;
      let key;
      try {
        pdfData = await createPdf(files);
      } catch (error) {
        if (error.status) throw new AppError(error.message, error.status);
        throw new AppError("Server error", 500);
      }
      if (!pdfPath) {
        const dateString = getISTDateString();
        const uniqueId = nanoid(10);
        const fileName = `${dateString}_${uniqueId}.pdf`;
        key = `receipts/${customerId}/${fileName}`;
      } else {
        key = pdfPath;
      }
      try {
        await uploadPdf(key, pdfData);
        pdfPath = key;
        imageUpload = true;
      } catch (error) {
        if (error.status) throw new AppError(error.message, error.status);
        console.error("Error uploading PDF to S3:", error);
        throw new AppError("Server error", 500);
      }
    }
    const newReceipt = { ...req.body };
    if (due !== receipt.due) {
      newReceipt.due = due;
      old.due = receipt.due;
      changes.due = due;
    }
    if (pdfPath && pdfPath !== receipt.receiptUrl) {
      newReceipt.receiptUrl = pdfPath;
      old.receiptUrl = receipt.receiptUrl;
      changes.receiptUrl = pdfPath;
    }
    if (imageUpload) {
      changes.imageUpload = true;
      old.imageUpload = true;
    }
    try {
      await updateReceipt(receiptId, newReceipt, session);
      const transactionLog = {
        userId,
        customerId,
        operation: "update receipt",
        entities: [
          {
            type: "Receipt",
            id: receiptId,
            action: "update",
            changes: { from: old, to: changes },
          },
        ],
      };
      await createTransactionLog(transactionLog, session);
      await session.commitTransaction();
      res.status(200).json({ message: "Receipt updated successfully" });
    } catch (error) {
      if (imageUpload && pdfPath) await permanentDeleteLatestPdf(pdfPath);
      if (error.status) throw new AppError(error.message, error.status);
      console.error("Error updating receipt:", error);
      throw new AppError("Server error", 500);
    }
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("Error updating receipt:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const getRecentReceiptsController = async (req, res) => {
  try {
    const recentReceipts = await getRecentReceipts();
    res.status(200).json(recentReceipts);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("Error getting recent receipts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteReceiptController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { receiptId, customerId } = req.params;
  const userId = req.userId;
  try {
    const receipt = await getReceipt(receiptId, null, session);
    if (!receipt || receipt.customerId != customerId)
      throw new AppError("Bad request", 400);
    const deposits = await getAllDeposit({ receiptId },"_id receiptId", null, session);
    const transactionLog = {
      userId,
      customerId,
      operation: "delete receipt",
      entities: [
        {
          type: "Receipt",
          id: receiptId,
          action: "delete",
          changes: receipt,
        },
      ],
    };
    if (deposits.length > 0) {
      deposits.forEach(async (deposit) => {
        await updateDeposit(deposit._id, { receiptId: null }, session);
        transactionLog.entities.push({
          type: "Deposit",
          id: deposit._id,
          action: "update",
          changes: {
            from: { receiptId: deposit.receiptId },
            to: { receiptId: null },
          },
        });
      });
    }
    await deleteReceipt(receiptId, session);
    await createTransactionLog(transactionLog, session);
    await session.commitTransaction();
    res.status(200).json({ message: "Receipt deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error("Error deleting receipt:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

export {
  createReceiptController,
  getAllReceiptController,
  getReceiptController,
  getPdfController,
  updateReceiptController,
  getRecentReceiptsController,
  deleteReceiptController,
};
