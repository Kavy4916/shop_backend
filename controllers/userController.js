import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import { changePassword } from "../services/userService.js";

const changePasswordController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;
  try {
    await changePassword(userId, oldPassword, newPassword, session);
    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

export {
  changePasswordController,
};
