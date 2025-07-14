import Joi from "joi";
import { getISTDateString } from "../../utils/utilityFunction.js";

const today = getISTDateString();

const customerIdSchema = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
});

const customerIdReceiptIdSchema = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
  receiptId: Joi.string().length(24).hex().required().messages({
    "string.base": "Receipt ID must be a string",
    "string.length": "Receipt ID must be 24 characters long",
    "string.hex": "Receipt ID must be a valid hex string",
    "any.required": "Receipt ID is required",
  }),
});

const customerIdReceiptIdDepositIdSchema = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
  receiptId: Joi.string().length(24).hex().required().messages({
    "string.base": "Receipt ID must be a string",
    "string.length": "Receipt ID must be 24 characters long",
    "string.hex": "Receipt ID must be a valid hex string",
    "any.required": "Receipt ID is required",
  }),
  depositId: Joi.string().length(24).hex().required().messages({
    "string.base": "Deposit ID must be a string",
    "string.length": "Deposit ID must be 24 characters long",
    "string.hex": "Deposit ID must be a valid hex string",
    "any.required": "Deposit ID is required",
  }),
})

const customerIdDepositIdSchema = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
  depositId: Joi.string().length(24).hex().required().messages({
    "string.base": "Deposit ID must be a string",
    "string.length": "Deposit ID must be 24 characters long",
    "string.hex": "Deposit ID must be a valid hex string",
    "any.required": "Deposit ID is required",
  }),
})


const createDepositSchemaBody = Joi.object({
  amount: Joi.number().required().messages({
    "number.base": "Amount must be a number",
    "any.required": "Amount is required",
  }),
  date: Joi.date().max(today).required().raw().messages({
    "date.base": "Date must be a valid date",
    "date.max": "Date cannot be in the future",
    "any.required": "Date is required",
  }),
  description: Joi.string().trim().allow("").max(150).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 200 characters",
  }),
  mode: Joi.string()
    .valid("cash", "online", "upi", "cheque")
    .required()
    .messages({
      "any.only": "Mode is not valid",
      "any.required": "Mode is required",
    }),
  byWhom: Joi.string().trim().allow("").max(50).min(3).messages({
    "string.base": "ByWhom must be a string",
    "string.max": "ByWhom cannot exceed 50 characters",
    "string.min": "ByWhom must be at least 3 characters long",
  }),
  type: Joi.string().valid("Normal", "Lahna").required().messages({
    "any.only": "Type is not valid",
    "any.required": "Type is required",
  }),
});

const createDepositSchema = {
  paramsSchema: customerIdSchema,
  bodySchema: createDepositSchemaBody,
};

const createDepositWithReceiptIdSchema = {
  paramsSchema: customerIdReceiptIdSchema,
  bodySchema: createDepositSchemaBody,
};

const updateDepositSchemaBody = Joi.object({
  amount: Joi.number().messages({
    "number.base": "Amount must be a number",
  }),
  date: Joi.date().max(today).raw().messages({
    "date.base": "Date must be a valid date",
    "date.max": "Date cannot be in the future",
  }),
  description: Joi.string().trim().allow("").max(150).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 200 characters",
  }),
  mode: Joi.string().valid("cash", "online", "upi", "cheque").messages({
    "any.only": "Mode is not valid",
  }),
  byWhom: Joi.string().trim().allow("").max(50).min(3).messages({
    "string.base": "ByWhom must be a string",
    "string.max": "ByWhom cannot exceed 50 characters",
    "string.min": "ByWhom must be at least 3 characters long",
  }),
  type: Joi.string().valid("Normal", "Lahna").messages({
    "any.only": "Type is not valid",
  }),
});

const updateDepositSchema = {
  paramsSchema: customerIdDepositIdSchema,
  bodySchema: updateDepositSchemaBody,
};

const updateDepositWithReceiptIdSchema = {
  paramsSchema: customerIdReceiptIdDepositIdSchema,
  bodySchema: updateDepositSchemaBody,
};

const settleDepositSchema = {
  paramsSchema: customerIdReceiptIdDepositIdSchema
}

const deleteDepositSchema = {
  paramsSchema: customerIdDepositIdSchema
}

const getUnsettledDepositSchema = {
  paramsSchema: customerIdSchema
}

const getAllDepositWithReceiptIdSchema = {
  paramsSchema: customerIdReceiptIdSchema
}

export {
  createDepositSchema,
  createDepositWithReceiptIdSchema,
  updateDepositSchema,
  updateDepositWithReceiptIdSchema,
  settleDepositSchema,
  deleteDepositSchema,
  getUnsettledDepositSchema,
  getAllDepositWithReceiptIdSchema
};
