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
    min: 1
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
    maxlength: 150,
    trim: true,
    default: ""
  },
  receiptUrl: {
    type: String,
    default: "",
    maxlength: 100
  },
});

export default mongoose.models.Receipt || mongoose.model("Receipt", receiptSchema);