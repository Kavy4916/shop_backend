import Customer from "../models/customer.js";
import AppError from "../utils/AppError.js";
import CustomerLog from "../models/customerLog.js";
import generator from "generate-password";
import bcrypt from "bcrypt";

const createCustomer = async (customer, userId, session) => {
  try {
    const password = generator.generate({
      length: 10,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
    });
    const hashedPassword = await bcrypt.hash(password, 12);

    const newCustomer = new Customer({
      ...customer,
      password: hashedPassword,
    });

    await newCustomer.save({ session });
    const customerLog = {
      customerId: newCustomer._id,
      action: "create",
      changedBy: userId,
      changes: {new: {...newCustomer, password: null}, old: null},
    };
    await CustomerLog.create([customerLog], { session });
  } catch (error) {
    console.error("Error creating customer:", error);
    throw new AppError("Server error", 500);
  }
};

const getCustomer = async (customerId, session) => {
  try {
    const query = Customer.findOne(customerId);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching customer", error);
    throw new AppError("Sevrer error", 500);
  }
};

const updateCustomer = async (customerId, customer, oldCustomer, userId, session) => {
  try {
    await Customer.findByIdAndUpdate(customerId,{ $set: customer}, {
      session,
    });
    const customerLog = {
      customerId,
      action: "update",
      changedBy: userId,
      changes: { new: customer, old: oldCustomer },
    };
    await CustomerLog.create([customerLog], { session });
  } catch (error) {
    console.error("Error updating customer", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getAllCustomer = async (session) => {
  try {
    const query = Customer.find({}, "_id name address");
    if (session)  query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching All customers:", error);
    throw new AppError("Sevrer error", 500);
  }
};

export { createCustomer, getCustomer, updateCustomer, getAllCustomer };
