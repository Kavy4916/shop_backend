import mongoose from "mongoose";

const alarmSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    receiptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Receipt",
        required: true,
    }
}, { timestamps: true });

export default mongoose.models.Alarm || mongoose.model("Alarm", alarmSchema);
   