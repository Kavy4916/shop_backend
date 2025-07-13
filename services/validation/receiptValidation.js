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
  description: Joi.string().trim().allow("").max(200).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 200 characters",
  }),
   alarmDate: Joi.date().greater(today).raw().messages({
    "date.base": "Date must be a valid date",
    "any.required": "Date is required",
    "date.greater": "Date must be in the future",
  }),
});

const createReceiptSchemaParams = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
});

const createReceiptSchema = {
  paramsSchema: createReceiptSchemaParams,
  bodySchema: createReceiptSchemaBody,
}

const updateReceiptSchemaBody = Joi.object({
  amount: Joi.number().min(1).messages({
    "number.base": "Amount must be a number",
    "number.min": "Amount must be greater than 0",
  }),
  date: Joi.date().max(today).messages({
    "date.base": "Date must be a valid date",
    "date.max": "Date cannot be in the future",
  }),
  description: Joi.string().trim().allow("").max(200).messages({
    "string.base": "Description must be a string",
    "string.max": "Description cannot exceed 200 characters",
  }),
});

const updateReceiptSchemaParams = Joi.object({
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
  paramsSchema: updateReceiptSchemaParams,
  bodySchema: updateReceiptSchemaBody,
}

const setReceiptAlarmSchemaBody = Joi.object({
  alarmDate: Joi.date().required().greater(today).messages({
    "date.base": "Date must be a valid date",
    "any.required": "Date is required",
    "date.greater": "Date must be in the future",
  }),
});

const setReceiptAlarmSchema = {
  paramsSchema: updateReceiptSchemaParams,
  bodySchema: setReceiptAlarmSchemaBody,
}

export {
  createReceiptSchema,
  updateReceiptSchema,
  setReceiptAlarmSchema,
};