import mongoose, { get } from "mongoose";
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
  deleteReceipt
} from "../services/receiptService.js";
import { getCustomer } from "../services/customerService.js";
import { getAllDeposit, updateDeposit } from "../services/depositService.js";
import { getISTDateString } from "../utils/utilityFunction.js";

const nanoid = customAlphabet("1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);
const createReceiptController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId } = req.params;
    const { date } = req.body;
    const files = req.files;
    let pdfPath = null;
    const customer = await getCustomer({_id:customerId}, session);
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
      createdBy: req.userId,
      receiptUrl: pdfPath, // will be null if no images uploaded
    };
    try {
      await createReceipt(receipt, req.userId, session);
    } catch (error) {
      if (pdfPath) {
        await permanentDeleteLatestPdf(pdfPath);
      }
      throw new AppError(error.message || "Server error", error.status || 500);
    }
    await session.commitTransaction();
    res.status(201).json({
      message: "Receipt created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const getAllReceiptController = async (req, res) => {
  const { customerId } = req.params;
  try {
    const receipts = await getAllReceipt({customerId});
    res.status(200).json(receipts);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
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
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateReceiptController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { customerId, receiptId } = req.params;
  const { amount } = req.body;
  const files = req.files;
  let pdfPath = null;
  let imageUpload = false;
  try {
    const receipt = await getReceipt(receiptId, session);
    if (!receipt || receipt.customerId.toString() !== customerId) {
      throw new AppError("Receipt not found", 404);
    }
    pdfPath = receipt.receiptUrl;
    let due = receipt.due;
    if(amount && amount !== receipt.amount){
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
        throw new AppError("Server error", 500);
      }
    }
    const newReceipt = { ...req.body, receiptUrl: pdfPath, due };
    try {
      await updateReceipt(
        receiptId,
        newReceipt,
        {...receipt, imageUpload},
        req.userId,
        session
      );
    } catch (error) {
      if (imageUpload && pdfPath) await permanentDeleteLatestPdf(pdfPath);
      if (error.status) throw new AppError(error.message, error.status);
      throw new AppError("Server error", 500);
    }
    await session.commitTransaction();
    res.status(200).json({ message: "Receipt updated successfully" });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
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
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteReceiptController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { receiptId,  customerId } = req.params;
  try {
    const receipt = await getReceipt(receiptId, session);
    if (!receipt || receipt.customerId != customerId)
      throw new AppError("Bad request", 400);
    const deposits = await getAllDeposit({ receiptId }, session);
    if (deposits.length > 0) {
      deposits.forEach(async (deposit) => {
        await updateDeposit(deposit._id, { receiptId: null }, {receiptId, message: "deleted receipt"}, req.userId, session);
      })
    }
    await deleteReceipt(receiptId, req.userId);
    await session.commitTransaction();
    res.status(200).json({ message: "Receipt deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
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
