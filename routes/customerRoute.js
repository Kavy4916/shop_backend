import express from "express";
import validateRequest from "../middlewares/validateRequest.js";
import {
    createCustomerSchema,
    updateCustomerSchema,
} from "../services/validation/CustomerValidation.js";
import {
    createCustomerController,
    updateCustomerController,
    getAllCustomerController,
    getCustomerController,
} from "../controllers/customerController.js";

const customerRouter = express.Router();

customerRouter.post(
    "/create",
    validateRequest(createCustomerSchema),
    createCustomerController
);
customerRouter.get("/all", getAllCustomerController);
customerRouter.get("/:customerId", getCustomerController);
customerRouter.post(
    "update/:customerId",
    validateRequest(updateCustomerSchema),
    updateCustomerController
);

export default customerRouter;