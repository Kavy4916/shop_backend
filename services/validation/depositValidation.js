import Joi from "joi";
import { getISTDateString } from "../../utils/utilityFunction.js";

const today = getISTDateString();

const createDepositSchemaBody = Joi.object({
  amount: Joi.number().required().messages({
    "number.base": "Amount must be a number",
    "any.required": "Amount is required",
  }),
  date: Joi.date().max(today).required().messages({
    "date.base": "Date must be a valid date",
    "date.max": "Date cannot be in the future",
    "any.required": "Date is required",
  }),
  description: Joi.string().trim().allow("").max(200).messages({
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
  byWhom: Joi.string().trim().allow("").max(50).messages({
    "string.base": "ByWhom must be a string",
    "string.max": "ByWhom cannot exceed 50 characters",
  }),
  type: Joi.string().valid("Normal", "Lahna").required().messages({
    "any.only": "Type is not valid",
    "any.required": "Type is required",
  }),
});

const createDepositSchemaParams = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
});

const createDepositSchema = {
  paramsSchema: createDepositSchemaParams,
  bodySchema: createDepositSchemaBody,
};

const createDepositReceiptSchemaParams = Joi.object({
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

const createDepositWithReceiptIdSchema = {
  paramsSchema: createDepositReceiptSchemaParams,
  bodySchema: createDepositSchemaBody,
};

const updateDepositSchemaBody = Joi.object({
  amount: Joi.number().messages({
    "number.base": "Amount must be a number",
  }),
  date: Joi.date().max(today).messages({
    "date.base": "Date must be a valid date",
    "date.max": "Date cannot be in the future",
  }),
  description: Joi.string().trim().allow("").max(200).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 200 characters",
  }),
  mode: Joi.string().valid("cash", "online", "upi", "cheque").messages({
    "any.only": "Mode is not valid",
  }),
  byWhom: Joi.string().trim().allow("").max(50).messages({
    "string.base": "ByWhom must be a string",
    "string.max": "ByWhom cannot exceed 50 characters",
  }),
  type: Joi.string().valid("Normal", "Lahna").messages({
    "any.only": "Type is not valid",
  }),
});

const updateDepositSchemaParams = Joi.object({
  depositId: Joi.string().length(24).hex().required().messages({
    "string.base": "Deposit ID must be a string",
    "string.length": "Deposit ID must be 24 characters long",
    "string.hex": "Deposit ID must be a valid hex string",
    "any.required": "Deposit ID is required",
  }),
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
});

const updateDepositSchema = {
  paramsSchema: updateDepositSchemaParams,
  bodySchema: updateDepositSchemaBody,
};

const updateDepositWithReceiptIdSchemaParams = Joi.object({
  depositId: Joi.string().length(24).hex().required().messages({
    "string.base": "Deposit ID must be a string",
    "string.length": "Deposit ID must be 24 characters long",
    "string.hex": "Deposit ID must be a valid hex string",
    "any.required": "Deposit ID is required",
  }),
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
  })
});

const updateDepositWithReceiptIdSchema = {
  paramsSchema: updateDepositWithReceiptIdSchemaParams,
  bodySchema: updateDepositSchemaBody,
};

const updateDepositAssignReceiptBody = Joi.object({
  receiptId: Joi.string().length(24).hex().required().messages({
    "string.base": "Receipt ID must be a string",
    "string.length": "Receipt ID must be 24 characters long",
    "string.hex": "Receipt ID must be a valid hex string",
    "any.required": "Receipt ID is required",
  }),
});

const updateDepositAssignReceiptSchema = {
  paramsSchema: updateDepositSchemaParams,
  bodySchema: updateDepositAssignReceiptBody,
};

export {
  createDepositSchema,
  createDepositWithReceiptIdSchema,
  updateDepositSchema,
  updateDepositWithReceiptIdSchema,
  updateDepositAssignReceiptSchema,
};
