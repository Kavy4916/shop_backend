import Customer from "../models/customer.js";
import User from "../models/user.js";
import Deposit from "../models/deposit.js";
import bcrypt from "bcrypt";
import generator from "generate-password";
import { PDFDocument, rgb } from "pdf-lib";
import sharp from "sharp";
import { validateId } from "../utils/userFunctions.js";
import { logout } from "./authController.js";
import Receipt from "../models/receipt.js";
import { nanoid } from "nanoid";
import s3 from "../utils/storageClient.js";
import mongoose from "mongoose";

const createReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let imageUpload = false;
  let fullPdfPath = null;

  try {
    const { _id } = req.params;
    validateId(_id, res);
    const files = req.files;
    const { date, amount, description, alarm, alarmDate } = req.body;

    if (!_id || !date || !amount)
      res.status(400).json({ message: "Missing required fields" });
    if (amount <= 0 || amount > 1000000)
      return res.status(400).json({ message: "Amount value is not allowed" });

    const customer = await Customer.findById(_id);
    if (!customer)
      return res.status(404).json({ message: "Customer not found" });

    if (files && files.length > 0) {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const buffer = await sharp(file.buffer)
          .resize({ width: 800 })
          .jpeg({ quality: 80 })
          .toBuffer();

        const image = await pdfDoc.embedJpg(buffer);
        const page = pdfDoc.addPage([image.width, image.height]);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const dateString = date;
      const uniqueId = nanoid(10);
      const fileName = `${dateString}_${uniqueId}.pdf`;
      const key = `receipts/${_id}/${fileName}`;

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: Buffer.from(pdfBytes),
        ContentType: "application/pdf",
      };

      await s3.upload(uploadParams).promise();
      fullPdfPath = key;
      imageUpload = true;
    }

    // Save to DB
    const receipt = new Receipt({
      customerId: _id,
      date: date,
      amount: amount || 0,
      description: description || "",
      alarm: alarm || false,
      createdBy: req.userId,
      alarmDate: alarmDate || null,
      receiptUrl: fullPdfPath, // will be null if no images uploaded
    });

    await receipt.save();
    session.commitTransaction();
    res.status(201).json({
      message: "Receipt created successfully",
    });
  } catch (error) {
    session.abortTransaction();
    console.error("Transaction aborted:", error);
    try {
      if (imageUpload && fullPdfPath) {
        const deleteParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fullPdfPath,
        };
        await s3.deleteObject(deleteParams).promise();
      }
    } catch (deleteError) {
      console.error("Error deleting receipt:", deleteError);
    }
    res.status(500).json({ message: "Server error" });
  } finally {
    session.endSession();
  }
};

const createCustomer = async (req, res) => {
  const { name, address, phone } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Name is required" });
  }
  try {
    const existingCustomer = await Customer.findOne({ name });
    if (existingCustomer) {
      return res
        .status(400)
        .json({ message: "Customer with this name already exists" });
    }
    const password = generator.generate({
      length: 10,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
    });
    const hashedPassword = await bcrypt.hash(password, 10);

    const newCustomer = new Customer({
      createdBy: req.userId,
      name,
      phone: phone || null,
      address: address || "unknown",
      password: hashedPassword,
    });

    await newCustomer.save();
    res.status(201).json({
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changePassword = async (req, res) => {
  const userId = req.userId;
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "OldPassword and newPassword are required" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return await logout(req, res);
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const lastEditedCustomers = async (req, res) => {
  try {
    let customers = await Customer.find({}, "_id name")
      .sort({ updatedAt: -1 })
      .limit(10);
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching last edited customers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const allCustomers = async (req, res) => {
  try {
    let customers = await Customer.find({}, "_id name");
    res.status(200).json(customers);
  } catch (error) {
    console.error("Error fetching last edited customers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getCustomerDetail = async (req, res) => {
  const { _id } = req.params;
  validateId(_id, res);
  try {
    const customer = await Customer.findById(_id).select("name address phone");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.status(200).json(customer);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllReceipts = async (req, res) => {
  const { _id } = req.params;
  validateId(_id, res);
  try {
    const receipts = await Receipt.find({ customerId: _id });
    const links = receipts.map((receipt) => {
      return `/customer/receipt/${_id}/${receipt._id}`;
    });
    res.status(200).json({ receipts, links });
  } catch (error) {
    console.error("Error fetching Receipts", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getFile = async (req, res) => {
  const key = req.query.receiptUrl;
  if (!key || key.length === 0 || key.length > 100)
    return res.status(400).json({ message: "Bad Request" });

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  };

  try {
    const s3Stream = s3.getObject(params).createReadStream();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=document.pdf");

    s3Stream.pipe(res);
  } catch (error) {
    console.error("Error streaming PDF:", error);
    res.status(500).json({ message: "Error retrieving PDF" });
  }
};

const updateCustomer = async (req, res) => {
  const { _id } = req.params;
  validateId(_id, res);
  const fields = req.body;
  try {
    const customer = await Customer.findById(_id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found!" });
    }
    await Customer.updateOne(
      { _id },
      {
        $set: {
          name: fields?.name || customer.name,
          address: fields?.address || customer.address,
          phone: fields?.phone || customer.phone,
        },
      }
    );
    res.status(204).send();
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllDeposits = async (req, res) => {
  const { receiptId, customerId } = req.params;
  validateId(customerId, res);
  validateId(receiptId, res);
  try {
    const deposits = await Deposit.find({ receiptId });
    const links = deposits.map((deposit) => {
      return `/deposit/${customerId}/${receiptId}/${deposit._id}`;
    });
    res.status(200).json({ deposits, links });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getReceipt = async (req, res) => {
  const { customerId, receiptId } = req.params;
  validateId(customerId, res);
  validateId(receiptId, res);
  try {
    const receipt = await Receipt.findById(receiptId);
    if (!receipt || receipt.customerId != customerId)
      return res.status(400).json({ message: "Bad Request" });
    res.status(200).json(receipt);
  } catch (error) {
    console.error("Error fetching receipt ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customerId, receiptId } = req.params;
    validateId(customerId, res);
    validateId(receiptId, res);
    const { date, amount, mode, byWhom, description } = req.body;
    if (!date || !amount || !mode) {
      return res.status(400).json({ message: "Required fields missing" });
    }
    const receipt = await Receipt.findById(receiptId).session(session);
    if (!receipt || receipt.customerId.toString() !== customerId) {
      return res.status(404).json({ message: "Receipt not found" });
    }
    if (receipt.due < amount) {
      return res
        .status(400)
        .json({ message: "Amount is greater than due amount" });
    }
    const newDeposit = new Deposit({
      date,
      amount,
      mode,
      byWhom: byWhom || "unknown",
      description: description || "",
      customerId,
      receiptId,
      createdBy: req.userId,
    });
    receipt.due = receipt.due - amount;
    await newDeposit.save({session});
    await receipt.save({session});
    await session.commitTransaction();
    res.status(200).json({ message: "Diposit created successfully" });
  } catch (error) {
    console.error("Error creating deposit ", error);
    res.status(500).json({ message: "Internal server error" });
  }finally{
    await session.endSession();
  }
};

const updateReceipt = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let fullPdfPath = null;
  let imageUpload = false;

  try {
    const { customerId, receiptId } = req.params;
    validateId(customerId, res);
    validateId(receiptId, res);
    const { date, amount, description } = req.body;
    const files = req.files;

    if (!date || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Amount value is not allowed" });
    }

    const receipt = await Receipt.findById(receiptId).session(session);
    if (!receipt || receipt.customerId.toString() !== customerId) {
      return res.status(400).json({ message: "Bad Request" });
    }
    const due =
      amount === receipt.amount
        ? receipt.due
        : receipt.due + (amount - receipt.amount);
    if (due < 0) return res.status(400).json({ message: "Bad Request" });

    fullPdfPath = receipt.receiptUrl;

    if (files && files.length > 0) {
      const pdfDoc = await PDFDocument.create();

      for (const file of files) {
        const buffer = await sharp(file.buffer)
          .resize({ width: 800 })
          .jpeg({ quality: 80 })
          .toBuffer();

        const image = await pdfDoc.embedJpg(buffer);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      let key;

      if (!fullPdfPath) {
        const dateString = getISTDateString(date);
        const uniqueId = nanoid(10);
        const fileName = `${dateString}_${uniqueId}.pdf`;
        key = `receipts/${customerId}/${fileName}`;
      } else {
        key = fullPdfPath;
      }

      await s3
        .upload({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: Buffer.from(pdfBytes),
          ContentType: "application/pdf",
        })
        .promise();

      fullPdfPath = key;
      imageUpload = true;
    }

    await Receipt.updateOne(
      { _id: receiptId },
      {
        $set: {
          date: date || receipt.date,
          amount: amount || receipt.amount,
          description: description || receipt.description,
          receiptUrl: fullPdfPath,
          due: due,
        },
      },
      { session }
    );

    await session.commitTransaction();
    res.status(204).send();
  } catch (error) {
    await session.abortTransaction();
    console.error("Transaction aborted:", error);

    if (imageUpload && fullPdfPath) {
      try {
        await s3
          .deleteObject({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: fullPdfPath,
          })
          .promise();
      } catch (s3Error) {
        console.error("Failed to delete uploaded file from S3:", s3Error);
      }
    }

    res.status(500).json({ message: "Internal server error" });
  } finally {
    session.endSession();
  }
};

export {
  createCustomer,
  changePassword,
  lastEditedCustomers,
  allCustomers,
  getAllReceipts,
  getCustomerDetail,
  createReceipt,
  updateCustomer,
  getFile,
  getAllDeposits,
  getReceipt,
  createDeposit,
  updateReceipt,
};
