import Joi from "joi";
import { getISTDateString } from "../../utils/utilityFunction.js";

const today = getISTDateString();

const createReceiptSchemaBody = Joi.object({
  amount: Joi.number().required().min(1).messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be greater than  0",
    "any.required": "Amount is required",
  }),
  date: Joi.date().required().max(today).raw().messages({
    "date.base": "Date must be a valid date",
    "any.required": "Date is required",
    "date.max": "Date cannot be in the future",
  }),
  description: Joi.string().trim().allow("").max(150).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 200 characters",
  }),
   alarmDate: Joi.date().greater(today).raw().messages({
    "date.base": "Date must be a valid date",
    "any.required": "Date is required",
    "date.greater": "Date must be in the future",
  }),
});

const customerIdSchema = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
});

const createReceiptSchema = {
  paramsSchema: customerIdSchema,
  bodySchema: createReceiptSchemaBody,
}

const updateReceiptSchemaBody = Joi.object({
  amount: Joi.number().min(1).messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be greater than 0",
  }),
  date: Joi.date().max(today).raw().messages({
    "date.base": "Date must be a valid date",
    "date.max": "Date cannot be in the future",
  }),
  description: Joi.string().trim().allow("").max(150).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 200 characters",
  }),
});

const customerIdReceiptIdSchema = Joi.object({
  receiptId: Joi.string().length(24).hex().required().messages({
    "string.base": "Receipt ID must be a string",
    "string.length": "Receipt ID must be 24 characters long",
    "string.hex": "Receipt ID must be a valid hex string",
    "any.required": "Receipt ID is required",
  }),
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
});

const updateReceiptSchema = {
  paramsSchema: customerIdReceiptIdSchema,
  bodySchema: updateReceiptSchemaBody,
}

const deleteReceiptSchema = {
  paramsSchema: customerIdReceiptIdSchema,
}

const getAllReceiptSchema = {
  paramsSchema: customerIdSchema,
}

const receiptURLRegex = /^receipts\/[a-f\d]{24}\/\d{4}-\d{2}-\d{2}_[a-zA-Z0-9]{10}\.pdf$/;

const pdfSchemaQuery = Joi.object({
  receiptUrl: Joi.string()
    .pattern(receiptURLRegex, 'receipt URL pattern')
    .required().messages({
      "string.base": "Receipt URL must be a string",
      "string.pattern.base": "Receipt URL must be valid",
      "any.required": "Receipt URL is required",
    })
});

const pdfSchema = {
  querySchema: pdfSchemaQuery,
}

export {
  createReceiptSchema,
  updateReceiptSchema,
  deleteReceiptSchema,
  getAllReceiptSchema,
  pdfSchema
};