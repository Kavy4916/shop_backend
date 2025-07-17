import mongoose from "mongoose";

const entityActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Receipt", "Deposit", "Customer"],
    required: true
  },
  id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  action: {
    type: String,
    enum: ["create", "update", "delete"],
    required: true
  },
  changes: mongoose.Schema.Types.Mixed
}, { _id: false });

const transactionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    operation: {
      type: String,
      required: true,
      enum: [
        "create deposit",
        "update deposit",
        "delete deposit",
        "create receipt",
        "update receipt",
        "delete receipt",
        "create customer",
        "update customer",
        "settle deposit",
        "unsettle deposit",
        "create deposit receipt",
        "update deposit receipt",
        "delete deposit receipt",
        "settle receipt",
      ],
    },
    entities: [entityActionSchema],
    context: {
      ip: String,
      userAgent: String,
      deviceId: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export default
  mongoose.models.TransactionLog ||
  mongoose.model("TransactionLog", transactionLogSchema);
