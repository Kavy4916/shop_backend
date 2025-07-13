import mongoose from "mongoose";

const UserLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  action: {
    type: String,
    enum: ["create", "update", "delete"],
    required: true,
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

export default mongoose.models.UserLog || mongoose.model("UserLog", UserLogSchema);
