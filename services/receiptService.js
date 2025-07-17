import Receipt from "../models/receipt.js";
import AppError from "../utils/AppError.js";

const createReceipt = async (receipt, session) => {
  try {
    if(!session) {
      console.error("No session provided at create receipt");
      throw new AppError("Server error", 500);
    }
    const newReceipt = await Receipt.create([receipt], { session });
    return newReceipt[0];
  } catch (error) {
    console.error("Error creating receipt:", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getAllReceipt = async (filter, select, sort, session) => {
  try {
    const query = Receipt.find(filter).select(select);
    if (session) query.session(session);
    if (sort) query.sort(sort);
    return await query;
  } catch (error) {
    console.error("Error fetching Receipts", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getReceipt = async (receiptId, select, session) => {
  try {
    const query = Receipt.findById(receiptId).select(select);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching receipt ", error);
    throw new AppError("Sevrer error", 500);
  }
};

const populateReceipt = async (receipts, path, select, session) => {
  try {
    const query = Receipt.populate( receipts, { path, select });
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
  session
) => {
  if(!session) {
    console.error("No session provided at update receipt");
    throw new AppError("Server error", 500);
  }
  try {
    await Receipt.findByIdAndUpdate(receiptId, { $set: receipt }).session(session);
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

const deleteReceipt = async (receiptId, session) => {
  if(!session) {
    console.error("No session provided at delete receipt");
    throw new AppError("Server error", 500);
  }
  try {
    await Receipt.findByIdAndDelete(receiptId).session(session);
  } catch (error) {
    console.error("Error deleting receipt ", error);
    throw new AppError("Sevrer error", 500);
  }
};

export { createReceipt, getAllReceipt, updateReceipt, getReceipt, getRecentReceipts, deleteReceipt, populateReceipt };
