import mongoose from "mongoose";

const depositLogSchema = new mongoose.Schema({
  depositId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Deposit",
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: ["create", "update", "delete"],
    required: true,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed, // { field: { from, to } }
    default: {},
  },
}, { timestamps: true });

export default mongoose.models.DepositLog || mongoose.model("DepositLog", depositLogSchema);
