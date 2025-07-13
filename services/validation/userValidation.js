import Joi from "joi";

const ChangePasswordSchemaBody = Joi.object({
  newPassword: Joi.string()
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$#&*%~])[A-Za-z\\d@$#&*%~]{8,20}$'
      )
    )
    .required()
    .messages({
      "string.pattern.base":
        "New Password must be in required format",
      "any.required": "New Password is required",
    }),

  oldPassword: Joi.string()
    .min(8)
    .max(20)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 20 characters",
      "any.required": "Old Password is required",
    }),
});

const changePasswordSchema = {
    bodySchema: ChangePasswordSchemaBody
}

export {changePasswordSchema};