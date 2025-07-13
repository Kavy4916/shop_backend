import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
    trim: true
  },
  phone: {
    type: String,
    default : null,
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  password: {
    type: String,
    default: null,
    trim: true
  },
},{ timestamps: true });

export default mongoose.models.Customer || mongoose.model("Customer", customerSchema);
