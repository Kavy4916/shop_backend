import User from "../models/user.js";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError.js";
import UserLog from "../models/userLog.js";


const getUser = async (userId, session) => {
    try {
        const user = await User.findById(userId).session(session);
        return user;
    } catch (error) {
        console.error("Error fetching user:", error);
        throw new AppError("Sevrer error", 500);
    }
};

const changePassword = async (userId, oldPassword, newPassword, session) => {
    try {
        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new AppError("User not found", 404);
        }
        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new AppError("Password is incorrect", 403);
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save({ session });
        const userLog = {
            userId,
            action: "update",
            changes: { new: "Password changed" },
        };
        await UserLog.create([userLog], { session });
    } catch (error) {
         if(error.status) throw new AppError(error.message, error.status);
        console.error("Error changing password:", error);
        throw new AppError("Server error", 500);
    }
};

export { getUser, changePassword };