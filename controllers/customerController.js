import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import {
  createCustomer,
  getCustomer,
  updateCustomer,
  getAllCustomer,
} from "../services/customerService.js";
const createCustomerController = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const userId = req.userId;
  try {
    const customer = await getCustomer({ name: req.body.name }, session);
    if (customer) throw new AppError("Customer name already exists", 400);
    await createCustomer({...req.body, createdBy: userId}, userId, session);
    await session.commitTransaction();
    res.status(201).json({
      message: "Customer created successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const getCustomerController = async (req, res) => {
  const { customerId } = req.params;
  try {
    const customer = await getCustomer({_id: customerId});
    res.status(200).json(customer);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error( error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateCustomerController = async (req, res) => {
  const { customerId } = req.params;
  const customer = req.body;
  const UserId = req.userId;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const oldCustomer = await getCustomer({_id: customerId}, session);
    if (!oldCustomer) throw new AppError("Customer not found", 404);
    await updateCustomer(customerId, customer, oldCustomer, UserId, session);
    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
};

const getAllCustomerController = async (req, res) => {
  try {
    const customers = await getAllCustomer();
    res.status(200).json(customers);
  } catch (error) {
    if (error.status)
      return res.status(error.status).json({ message: error.message });
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createCustomerController,
  getCustomerController,
  updateCustomerController,
  getAllCustomerController,
};
