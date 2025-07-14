import mongoose from "mongoose";
import {
  getAllDeposit,
  createDeposit,
  getRecentDeposits,
  getDeposit,
  updateDeposit,
  deleteDeposit
} from "../services/depositService.js";
import AppError from "../utils/AppError.js";

import { getReceipt, updateReceipt } from "../services/receiptService.js";
import receipt from "../models/receipt.js";

const createDepositWithReceiptIdController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, receiptId } = req.params;
    const userId = req.userId;
    const deposit = req.body;
    const receipt = await getReceipt(receiptId, session);
    if (
      !receipt ||
      receipt.customerId.toString() !== customerId
    )
      throw new AppError("Bad request", 400);
    if (receipt.due < deposit.amount)
      throw new AppError("Deposit amount is greater than due amount", 400);
    const depositId = await createDeposit(
      {
        ...deposit,
        customerId,
        receiptId,
        createdBy: userId
      },
      userId,
      session
    );
    await updateReceipt(receiptId, { due: receipt.due - deposit.amount }, {due: receipt.due, message: "created deposit", depositId}, userId, session);
    await session.commitTransaction();
    res.status(201).json({ message: "Deposit created successfully" });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const getAllDepositWithReceiptIdController = async (req, res) => {
  const { receiptId, customerId } = req.params;
  try {
    const deposits = await getAllDeposit({customerId, receiptId});
    const links = deposits.map((deposit) => {
      return `/deposit/update/receipt/${customerId}/${receiptId}/${deposit._id}`;
    });
    res.status(200).json({ deposits, links });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createDepositController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId } = req.params;
    const userId = req.userId;
    const deposit = req.body;
    await createDeposit({...deposit,  customerId, createdBy: userId}, userId, session);
    await session.commitTransaction();
    res.status(201).json({ message: "Deposit created successfully" });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const getRecentDepositsController = async (req, res) => {
  try {
    const recentDeposits = await getRecentDeposits();
    res.status(200).json(recentDeposits);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getDepositWithReceiptIdController = async (req, res) => {
  const { customerId, depositId, receiptId } = req.params;
  try {
    const deposit = await getDeposit(depositId);
    if (
      !deposit ||
      deposit.customerId.toString() !== customerId ||
      deposit.receiptId.toString() !== receiptId
    )
      throw new AppError("Deposit not found", 404);
    res.status(200).json(deposit);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateDeppositWithReceiptIdController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const { customerId, depositId, receiptId } = req.params;
    const userId = req.userId;  
    const deposit = req.body;
    const oldDeposit = await getDeposit(depositId, session);
    const receipt = await getReceipt(receiptId, session);
    if (
      !oldDeposit ||
      !receipt ||
      oldDeposit.customerId.toString() !== customerId ||
      receipt.customerId.toString() !== customerId
    )
      throw new AppError("Bad request", 400);
    if (deposit.amount && deposit.amount !== oldDeposit.amount) {
      const due = receipt.due - deposit.amount + oldDeposit.amount;
      if (due < 0) throw new AppError("Due can't be negative", 400);
      await updateReceipt(
        receiptId,
        {due: due},
        { depositId: depositId,
        message: "updated deposit",
        due: receipt.due},
        userId,
        session
      );
    }
    await updateDeposit(
      depositId,
      deposit,
      oldDeposit,
      userId,
      session
    )
    await session.commitTransaction();
    res.status(200).json({ message: "Deposit updated successfully" });
  } catch(error){
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const updateDepositController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { depositId, customerId } = req.params;
    const userId = req.userId;
    const deposit = req.body;
    const oldDeposit = await getDeposit(depositId, session);
    if (!oldDeposit || oldDeposit.customerId.toString() !== customerId)
      throw new AppError("Bad request", 400);
    await updateDeposit(depositId, deposit, oldDeposit, userId, session);
    await session.commitTransaction();
    res.status(200).json({ message: "Deposit updated successfully" });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
}

const getAllUnsettledDepositController = async (req, res) => {
  const {customerId} = req.params;
  try {
    const deposits = await getAllDeposit({receiptId: null, customerId});
    res.status(200).json(deposits);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

const getDepositController = async (req, res) => {
  const { depositId, customerId } = req.params;
  try {
    const deposit = await getDeposit(depositId);
    if (
      !deposit ||
      deposit.customerId.toString() !== customerId
    )
      throw new AppError("Deposit not found", 404);
    res.status(200).json(deposit);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const settleDepositController = async (req, res) => {
  const {customerId, receiptId, depositId} = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deposit = await getDeposit(depositId, session);
    const receipt = await getReceipt(receiptId, session);
    if (
      !deposit || !receipt ||
      deposit.customerId.toString() !== customerId || receipt.customerId.toString() !== customerId || deposit.receiptId
    )
      throw new AppError("Bad request", 400);
    if(deposit.amount > receipt.due)
      throw new AppError("Deposit amount is greater than due amount", 400);
    await updateReceipt(receiptId, { due: receipt.due - deposit.amount }, {due: receipt.due, message: "settled deposit", depositId}, req.userId, session);
    await updateDeposit(depositId, { receiptId: receipt._id }, {receiptId, message: "settled deposit"}, req.userId, session);
    await session.commitTransaction();
    res.status(200).json({ message: "Deposit settled successfully" });
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
}

const deleteDepositWithReceiptIdController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, receiptId, depositId } = req.params;
    const userId = req.userId;
    const receipt = await getReceipt(receiptId, session);
    const deposit = await getDeposit(depositId, session);
    if (!receipt || !deposit || receipt.customerId.toString() !== customerId || deposit.customerId.toString() !== customerId || deposit.receiptId.toString() !== receiptId)
      throw new AppError("Bad request", 400);
    await deleteDeposit(depositId, deposit, userId, session);
    await updateReceipt(receiptId, { due: receipt.due + deposit.amount }, {due: receipt.due, message: "deleted deposit", depositId}, userId, session);
    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }

};

const deleteDepositController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, depositId } = req.params;
    const userId = req.userId;
    const deposit = await getDeposit(depositId, session);
    if (!deposit || deposit.customerId.toString() !== customerId)
      throw new AppError("Bad request", 400);
    await deleteDeposit(depositId, deposit, userId, session);
    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
}

const removeDepositController = async (req, res) => {
  const { customerId, receiptId, depositId } = req.params;
  const userId = req.userId;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const receipt = await getReceipt(receiptId, session);
    const deposit = await getDeposit(depositId, session);
    if (!receipt || !deposit || receipt.customerId.toString() !== customerId || deposit.customerId.toString() !== customerId || deposit.receiptId.toString() !== receiptId)
      throw new AppError("Bad request", 400);
    await updateDeposit(depositId, { receiptId: null }, {receiptId : receiptId, message: "unsettled deposit"}, userId, session);
    await updateReceipt(receiptId, { due: receipt.due + deposit.amount }, {due: receipt.due, message: "unsettled deposit", depositId}, userId, session);
    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

export {
  createDepositWithReceiptIdController,
  getAllDepositWithReceiptIdController,
  createDepositController,
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
};
