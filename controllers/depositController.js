import mongoose from "mongoose";
import _ from "lodash";
import {
  getAllDeposit,
  createDeposit,
  getRecentDeposits,
  getDeposit,
  updateDeposit,
  deleteDeposit,
} from "../services/depositService.js";
import AppError from "../utils/AppError.js";

import { getReceipt, updateReceipt } from "../services/receiptService.js";
import { getOldChangesFields } from "../utils/utilityFunction.js";
import { createTransactionLog } from "../services/transactionLogService.js";

const createDepositWithReceiptIdController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, receiptId } = req.params;
    const userId = req.userId;
    const deposit = req.body;
    const receipt = await getReceipt(receiptId, "customerId due", session);
    if (!receipt || receipt.customerId.toString() !== customerId)
      throw new AppError("Bad request", 400);
    const newDew = receipt.due - deposit.amount;
    if (newDew < 0)
      throw new AppError("Deposit amount is greater than due amount", 400);
    const newDeposit = await createDeposit(
      {
        ...deposit,
        customerId,
        receiptId,
      },
      session
    );
    await updateReceipt(
      receiptId,
      { due: receipt.due - deposit.amount },
      session
    );
    const transactionLog = {
      userId,
      customerId,
      operation: "create deposit receipt",
      entities: [
        {
          type: "Deposit",
          id: newDeposit._id,
          action: "create",
          changes: newDeposit,
        },
        {
          type: "Receipt",
          id: receiptId,
          action: "update",
          changes: { from: { due: receipt.due }, to: { due: newDew } },
        },
      ],
    };
    await createTransactionLog(transactionLog, session);
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
    const deposits = await getAllDeposit(
      { customerId, receiptId },
      "_id amount receiptId date byWhom mode customerId",
      { date: -1 }
    );
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
    const newDeposit = await createDeposit({ ...deposit, customerId }, session);
    const transactionLog = {
      userId,
      customerId,
      operation: "create deposit",
      entities: [
        {
          type: "Deposit",
          id: newDeposit._id,
          action: "create",
          changes: newDeposit,
        },
      ],
    };
    await createTransactionLog(transactionLog, session);
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
    const recentDeposits = await getRecentDeposits(
      "_id amount receiptId date",
      0,
      10
    );
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
    const deposit = await getDeposit(
      depositId,
      "_id amount receiptId date byWhom mode customerId type description"
    );
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
  try {
    const { customerId, depositId, receiptId } = req.params;
    const userId = req.userId;
    const deposit = req.body;
    const oldDeposit = await getDeposit(depositId, "", session);
    const receipt = await getReceipt(receiptId, "customerId due", session);
    if (
      !oldDeposit ||
      !receipt ||
      oldDeposit.customerId.toString() !== customerId ||
      receipt.customerId.toString() !== customerId ||
      oldDeposit.receiptId.toString() !== receiptId
    )
      throw new AppError("Bad request", 400);
    let due = receipt.due;
    if (deposit.amount && deposit.amount !== oldDeposit.amount) {
      due = due - deposit.amount + oldDeposit.amount;
      if (due < 0) throw new AppError("Due can't be negative", 400);
      await updateReceipt(receiptId, { due: due }, session);
    }
    const [old, changes] = getOldChangesFields(oldDeposit, deposit);
    if (_.isEqual(old, {})) throw new AppError("No changes", 400);
    await updateDeposit(depositId, changes, session);
    const transactionLog = {
      userId,
      customerId,
      operation: "update deposit receipt",
      entities: [
        {
          type: "Deposit",
          id: depositId,
          action: "update",
          changes: { from: old, to: changes },
        },
      ],
    };
    if (receipt.due !== due) {
      transactionLog.entities.push({
        type: "Receipt",
        id: receiptId,
        action: "update",
        changes: { from: { due: receipt.due }, to: { due: due } },
      });
    }
    await createTransactionLog(transactionLog, session);
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
};

const updateDepositController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { depositId, customerId } = req.params;
    const userId = req.userId;
    const deposit = req.body;
    const oldDeposit = await getDeposit(
      depositId,
      "_id customerId receiptId amount date byWhom mode type description",
      session
    );
    if (
      !oldDeposit ||
      oldDeposit.customerId.toString() !== customerId ||
      oldDeposit.receiptId
    )
      throw new AppError("Bad request", 400);
    const [old, changes] = getOldChangesFields(oldDeposit, deposit);
    if (_.isEqual(old, {})) throw new AppError("No changes", 400);
    await updateDeposit(
      depositId,
      changes,
      session
    );
    const transactionLog = {
      userId,
      customerId,
      operation: "update deposit",
      entities: [
        {
          type: "Deposit",
          id: depositId,
          action: "update",
          changes: { from: old, to: changes },
        },
      ],
    };
    await createTransactionLog(transactionLog, session);
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
};

const getAllUnsettledDepositController = async (req, res) => {
  const { customerId } = req.params;
  try {
    const deposits = await getAllDeposit(
      { receiptId: null, customerId },
      "_id amount receiptId date byWhom mode customerId",
      { date: -1 }
    );
    res.status(200).json(deposits);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getDepositController = async (req, res) => {
  const { depositId, customerId } = req.params;
  try {
    const deposit = await getDeposit(depositId);
    if (!deposit || deposit.customerId.toString() !== customerId)
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
  const { customerId, receiptId, depositId } = req.params;
  const userId = req.userId;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deposit = await getDeposit(
      depositId,
      "amount _id customerId receiptId",
      session
    );
    const receipt = await getReceipt(receiptId, "customerId due", session);
    if (
      !deposit ||
      !receipt ||
      deposit.customerId.toString() !== customerId ||
      receipt.customerId.toString() !== customerId ||
      deposit.receiptId
    )
      throw new AppError("Bad request", 400);
    const newDue = receipt.due - deposit.amount;
    if (newDue < 0)
      throw new AppError("Deposit amount is greater than due amount", 400);
    await updateReceipt(
      receiptId,
      { due: newDue },
      session
    );
    await updateDeposit(
      depositId,
      {receiptId: receipt._id },
      session
    );
    const transactionLog = {
      userId,
      customerId,
      operation: "settle deposit",
      entities: [
        {
          type: "Receipt",
          id: receiptId,
          action: "update",
          changes: { from: { due: receipt.due }, to: { due: newDue } },
        },
        {
          type: "Deposit",
          id: depositId,
          action: "update",
          changes: { from: { receiptId: null }, to: { receiptId: receiptId } },
        },
      ],
    };
    await createTransactionLog(transactionLog, session);
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
};

const deleteDepositWithReceiptIdController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, receiptId, depositId } = req.params;
    const userId = req.userId;
    const receipt = await getReceipt(receiptId, "_id customerId due", session);
    const deposit = await getDeposit(depositId, "", session);
    if (
      !receipt ||
      !deposit ||
      receipt.customerId.toString() !== customerId ||
      deposit.customerId.toString() !== customerId ||
      deposit.receiptId.toString() !== receiptId
    )
      throw new AppError("Bad request", 400);
    const newDue = receipt.due + deposit.amount;  
    await deleteDeposit(
      depositId,
      session
    );
    await updateReceipt(
      receiptId,
      { due: newDue },
      session
    );
    const transactionLog = {
      userId,
      customerId,
      operation: "delete deposit receipt",
      entities: [
        {
          type: "Deposit",
          id: depositId,
          action: "delete",
          changes: deposit,
        },
        {
          type: "Receipt",
          id: receiptId,
          action: "update",
          changes: { from: { due: receipt.due }, to: { due: newDue } },
        }
      ],
    };
    await createTransactionLog(transactionLog, session);
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
    const deposit = await getDeposit(depositId, null, session);
    if (!deposit || deposit.customerId.toString() !== customerId)
      throw new AppError("Bad request", 400);
    await deleteDeposit(depositId, session);
    const transactionLog = {
      userId,
      customerId,
      operation: "delete deposit",
      entities: [
        {
          type: "Deposit",
          id: depositId,
          action: "delete",
          changes: deposit,
        },
      ],
    };
    await createTransactionLog(transactionLog, session);
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

const removeDepositController = async (req, res) => {
  const { customerId, receiptId, depositId } = req.params;
  const userId = req.userId;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const receipt = await getReceipt(receiptId, "_id customerId due", session);
    const deposit = await getDeposit(
      depositId,
      "_id customerId receiptId amount",
      session
    );
    if (
      !receipt ||
      !deposit ||
      receipt.customerId.toString() !== customerId ||
      deposit.customerId.toString() !== customerId ||
      deposit.receiptId.toString() !== receiptId
    )
      throw new AppError("Bad request", 400);
    const newDue = receipt.due + deposit.amount;  
    await updateDeposit(
      depositId,
      { receiptId: null },
      session
    );
    await updateReceipt(
      receiptId,
      { due: newDue },
      session
    );
    const transactionLog = {
      userId,
      customerId,
      operation: "unsettle deposit",
      entities: [
        {
          type: "Deposit",
          id: depositId,
          action: "update",
          changes: { from: { receiptId }, to: { receiptId: null } },
        },
        {
          type: "Receipt",
          id: receiptId,
          action: "update",
          changes: { from: { due: receipt.due }, to: { due: newDue } },
        }
      ],
    };
    await createTransactionLog(transactionLog, session);
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
  removeDepositController,
};
