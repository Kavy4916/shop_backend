import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 50,
    minlength: 3,
    trim: true
  },
  phone: {
    type: String,
    default : "",
    maxlength: 10,
    trim: true
  },
  address: {
    type: String,
    trim: true,
    default: "",
    maxlength: 150
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  password: {
    type: String,
    default: "",
    trim: true,
    maxlength: 150
  },
},{ timestamps: true });

export default mongoose.models.Customer || mongoose.model("Customer", customerSchema);
