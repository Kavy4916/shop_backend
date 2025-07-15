import Receipt from "../models/receipt.js";
import ReceiptLog from "../models/receiptLog.js";
import AppError from "../utils/AppError.js";

const createReceipt = async (receipt, userId, session) => {
  try {
    const newReceipt = await Receipt.create([receipt], { session });
    const receiptLog = {
      receiptId: newReceipt[0]._id,
      action: "create",
      changedBy: newReceipt[0].createdBy,
      changes:{new: newReceipt[0], old: null}
    };
    await ReceiptLog.create([receiptLog], { session });
  } catch (error) {
    console.error("Error creating receipt:", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getAllReceipt = async (filter, session) => {
  try {
    const query = Receipt.find(filter);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching Receipts", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getReceipt = async (receiptId, session) => {
  try {
    const query = Receipt.findById(receiptId);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching receipt ", error);
    throw new AppError("Sevrer error", 500);
  }
};

const updateReceipt = async (
  receiptId,
  receipt,
  oldReceipt,
  userId,
  session
) => {
  try {
    await Receipt.findByIdAndUpdate(receiptId, { $set: receipt }).session(session);
    const receiptLog = {
      receiptId,
      action: "update",
      changedBy: userId,
      changes: { new:  receipt, old: oldReceipt },
    };
    await ReceiptLog.create([receiptLog], { session });
  } catch (error) {
    console.error("Error updating receipt ", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getRecentReceipts = async (session) => {
  try{
    const query = Receipt.find({}).select("_id amount date description").populate({
    path: "customerId",
    select: "_id, name",
  }).sort({ updatedAt: -1 }).limit(10);
    if (session) query.session(session);
    return await query;
  }catch(error){
    console.error("Error fetching recent Receipts", error);
    throw new AppError("Sevrer error", 500);
  }
};

const deleteReceipt = async (receiptId, userId, session) => {
  try {
    const oldReceipt = await Receipt.findByIdAndDelete(receiptId).session(session);
    const receiptLog = {
      receiptId,
      action: "delete",
      changedBy: userId,
      changes: { new: null, old: oldReceipt },
    };
    await ReceiptLog.create([receiptLog], { session });
  } catch (error) {
    console.error("Error deleting receipt ", error);
    throw new AppError("Sevrer error", 500);
  }
};

export { createReceipt, getAllReceipt, updateReceipt, getReceipt, getRecentReceipts, deleteReceipt };
