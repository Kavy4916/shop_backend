import Deposit from "../models/deposit.js";
import DepositLog from "../models/depositLog.js";
import AppError from "../utils/AppError.js";

const getDeposit = async (depositId, session) => {
  try {
    const query = Deposit.findById(depositId);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching deposit ", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getAllDeposit = async (filter, session) => {
  try {
    const query = Deposit.find(filter);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching Deposits", error);
    throw new AppError("Sevrer error", 500);
  }
};

const createDeposit = async (deposit, userId, session) => {
  try {
    const newDeposit = new Deposit(deposit);
    await newDeposit.save({ session });
    const depositLog = {
      depositId: newDeposit._id,
      action: "create",
      changedBy: userId,
      changes: {new: newDeposit, old: null},
    };
    await DepositLog.create([depositLog], { session });
    return newDeposit._id;
  } catch (error) {
    console.error("Error creating deposit: ", error);
    throw new AppError("Server error", 500);
  }
};


const updateDeposit = async (
  depositId,
  deposit,
  oldDeposit,
  userId,
  session
) => {
  try {
    await Deposit.findByIdAndUpdate(depositId, { $set: deposit }, { session});
    const depositLog = {
      depositId,
      action: "update",
      changedBy: userId,
      changes: { new: deposit, old: oldDeposit },
    };
    await DepositLog.create([depositLog], { session });
  } catch (error) {
    console.error("Error updating deposit: ", error);
    throw new AppError("Server error", 500);
  }
};


const deleteDeposit = async (depositId, oldDeposit, userId, session) => {
  try{
    const depositLog = {
      depositId,
      action: "delete",
      changedBy: userId,
      changes: { new: null, old: oldDeposit },
    };
    await DepositLog.create([depositLog], { session });
    await Deposit.findByIdAndDelete(depositId, { session });
  }catch(error){
    console.error("Error deleting deposit: ", error);
    throw new AppError("Server error", 500);
  }

};

const getRecentDeposits = async (session) => {
  try{
    const query = Deposit.find({}).select("_id amount").populate({
    path: "customerId",
    select: "_id, name",
  }).sort({ updatedAt: -1 }).limit(10);
    if (session) query.session(session);
    return await query;
  }catch(error){
    console.error("Error fetching recent Deposits", error);
    throw new AppError("Sevrer error", 500);
  }
};

export {
  createDeposit,
  getDeposit,
  getAllDeposit,
  updateDeposit,
  deleteDeposit,
  getRecentDeposits
};
