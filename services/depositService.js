import Deposit from "../models/deposit.js";
import AppError from "../utils/AppError.js";

/**
 * Fetches a deposit by its ID.
 * @param {String} depositId - The ID of the deposit to retrieve.
 * @param {Object} select - The fields to select from the database.
 * @param {Session} session - The mongoose session to use (optional).
 * @returns {Promise<Deposit>} - The deposit document.
 * @throws {AppError} - If an error occurs while fetching the deposit.
 */

const getDeposit = async (depositId, select, session) => {
  try {
    const query = Deposit.findById(depositId).select(select);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching deposit ", error);
    throw new AppError("Sevrer error", 500);
  }
};

/**
 * Fetches all deposits matching the given filter
 * @param {Object} filter - The mongodb query filter
 * @param {Object} select - The fields to select from the database
 * @param {Object} sort - The fields to sort on (optional)
 * @param {Session} session - The mongoose session to use (optional)
 * @returns {Promise<Array<Deposit>>} - The array of deposits
 */
const getAllDeposit = async (filter, select, sort, session) => {
  try {
    let query = Deposit.find(filter).select(select);
    if (sort) query = query.sort(sort);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching Deposits", error);
    throw new AppError("Sevrer error", 500);
  }
};

const createDeposit = async (deposit, session) => {
  try {
    const newDeposit = new Deposit(deposit);
    return await newDeposit.save({ session });
  } catch (error) {
    console.error("Error creating deposit: ", error);
    throw new AppError("Server error", 500);
  }
};


const updateDeposit = async (
  depositId,
  deposit,
  session
) => {
  try {
    await Deposit.findByIdAndUpdate(depositId, { $set: deposit }, { session});
  } catch (error) {
    console.error("Error updating deposit: ", error);
    throw new AppError("Server error", 500);
  }
};


const deleteDeposit = async (depositId, session) => {
  try{
    await Deposit.findByIdAndDelete(depositId, { session });
  }catch(error){
    console.error("Error deleting deposit: ", error);
    throw new AppError("Server error", 500);
  }

};

/**
 * Fetches the recent deposits.
 * @param {Object} select - The fields to select from the database.
 * @param {Number} offset - The number of documents to skip.
 * @param {Number} limit - The maximum number of documents to return.
 * @param {Session} session - The mongoose session to use (optional).
 * @returns {Promise<Array<Deposit>>} - The recent deposits, sorted by updatedAt in descending order.
 * @throws {AppError} - If an error occurs while fetching the recent deposits.
 */
const getRecentDeposits = async (select, offset, limit, session) => {
  try{
    const query = Deposit.find({}).select(select).populate({
    path: "customerId",
    select: "_id, name",
  }).sort({ updatedAt: -1 }).limit(limit).skip(offset);
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
