import mongoose from "mongoose";


const depositSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  receiptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Receipt",
    required: true
  },
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number, 
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  byWhom: {
    type: String,
    maxlength: 100,
    trim: true,
  },
  mode: {
    type: String,
    enum: ["cash", "upi", "cheque", "other"],
    default: "cash",
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true
  }
});

export default mongoose.models.Deposit || mongoose.model("Deposit", depositSchema);