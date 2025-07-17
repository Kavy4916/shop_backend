import Customer from "../models/customer.js";
import AppError from "../utils/AppError.js";
import generator from "generate-password";
import bcrypt from "bcrypt";

const createCustomer = async (customer, session) => {
  try {
    if (!session) {
      console.error("Session not found in createCustomer");
      throw new AppError("Sevrer error", 500);
    }
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
    return newCustomer;
  } catch (error) {
    if (error.status) throw new AppError(error.message, error.status);
    console.error("Error creating customer:", error);
    throw new AppError("Server error", 500);
  }
};

const getCustomer = async (customerId, select, session) => {
  try {
    const query = Customer.findOne(customerId).select(select);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching customer", error);
    throw new AppError("Sevrer error", 500);
  }
};

const updateCustomer = async (customerId, customer, session) => {
  try {
    await Customer.findByIdAndUpdate(
      customerId,
      { $set: customer },
      {
        session,
      }
    );
  } catch (error) {
    console.error("Error updating customer", error);
    throw new AppError("Sevrer error", 500);
  }
};

const getAllCustomer = async (select, session) => {
  try {
    const query = Customer.find({}, "_id name address").select(select);
    if (session) query.session(session);
    return await query;
  } catch (error) {
    console.error("Error fetching All customers:", error);
    throw new AppError("Sevrer error", 500);
  }
};

export { createCustomer, getCustomer, updateCustomer, getAllCustomer };
