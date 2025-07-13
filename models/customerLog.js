import mongoose from "mongoose";

const customerLogSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
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
    type: mongoose.Schema.Types.Mixed, // can hold object like { field: { from, to } }
    default: {},
  },
}, { timestamps: true });

export default mongoose.models.CustomerLog || mongoose.model("CustomerLog", customerLogSchema);
