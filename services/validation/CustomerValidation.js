import Joi from "joi";
//import { getISTDateString } from "../utils/utilityFunction.js";


const createCustomerSchemaBody = Joi.object({
  name: Joi.string().trim().max(50).min(3).required().messages({
    "string.base": "Name must be a string",
    "string.max": "Name cannot exceed 50 characters",
    "string.min": "Name must be at least 3 characters long",
    "any.required": "Name is required",
  }),
  address: Joi.string().trim().allow("").max(150).messages({
    "string.base": "Address must be a string",
    "string.max": "Address cannot exceed 150 characters",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("").message("Phone number must be a 10-digit number",
    )
});

const createCustomerSchema = {
  bodySchema: createCustomerSchemaBody
}

const updateCustomerSchemaBody = Joi.object({
  name: Joi.string().trim().max(50).min(3).messages({
    "string.base": "Name must be a string",
    "string.max": "Name cannot exceed 50 characters",
    "string.min": "Name must be at least 3 characters long",
  }),
  address: Joi.string().trim().allow("").max(150).messages({
    "string.base": "Address must be a string",
    "string.max": "Address cannot exceed 150 characters",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow(null).message(
      "Phone number must be a 10-digit number"
    ),
});

const updateCustomerSchemaParams = Joi.object({
  customerId: Joi.string().length(24).hex().required().messages({
    "string.base": "Customer ID must be a string",
    "string.length": "Customer ID must be 24 characters long",
    "string.hex": "Customer ID must be a valid hex string",
    "any.required": "Customer ID is required",
  }),
});

const updateCustomerSchema = {
  paramsSchema: updateCustomerSchemaParams,
  bodySchema: updateCustomerSchemaBody,
};

export {
  createCustomerSchema,
  updateCustomerSchema,
};
