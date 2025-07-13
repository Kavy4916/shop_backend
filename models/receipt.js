import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  due: {
    type: Number,
    default: function () {
      return this.amount || 0;
    },
    required: true,
    min: 0,
  },
  description: {
    type: String,
    maxlength: 200,
    trim: true,
    default: null
  },
  receiptUrl: {
    type: String,
    default: null
  },
  alarmDate: {
    type: Boolean,
    default: null
  },
});

export default mongoose.models.Receipt || mongoose.model("Receipt", receiptSchema);