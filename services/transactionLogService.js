import TransactionLog from "../models/transactionLog.js";
import AppError from "../utils/AppError.js";

const createTransactionLog = async (transactionLog, session) => {
    try {
        if(!session) {
            console.error("Session not found");
            throw new AppError("Sevrer error", 500);
        }
        return await TransactionLog.create([transactionLog], { session });
    } catch (error) {
        console.error("Error creating transaction log ", error);
        throw new AppError("Sevrer error", 500);
    }
};

const getAllTransactionLog = async (filter="", select=null, sort=null, limit=20, skip=0, populate, session) => {
    try {
        const query = TransactionLog.find(filter).select(select);
        if (session) query.session(session);
        if (sort) query.sort(sort);
        if (populate) query.populate(populate);
        query.limit(limit).skip(skip);
        return await query;
    } catch (error) {
        console.error("Error fetching transaction log ", error);
        throw new AppError("Sevrer error", 500);
    }
};

const getDocumentCount = async (filter, session) => {
    try {
        return await TransactionLog.countDocuments(filter).session(session);
    } catch (error) {
        console.error("Error fetching transaction log ", error);
        throw new AppError("Sevrer error", 500);
    }
};

export  {createTransactionLog, getAllTransactionLog, getDocumentCount};