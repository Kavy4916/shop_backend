
const validateRequest = ({ bodySchema, paramsSchema, querySchema }) => {
  return (req, res, next) => {
    // Validate body
    if (bodySchema) {
      const { error, value } = bodySchema.validate(req.body, {
        abortEarly: true,
        stripUnknown: true
      });
      if (error) {
        return res.status(400).json({
        message:  error.details[0].message
        });
      }
      req.body = value; // Replace with sanitized body
    }

    // Validate params
    if (paramsSchema) {
      const { error, value } = paramsSchema.validate(req.params, {
        abortEarly: true,
        stripUnknown: true
      });
      if (error) {
        console.log("Error in params: ", error.details[0].message);
        return res.status(401).json({
          message: "Bad Request",
        });
      }
      req.params = value;
    }

    // Validate query
    if (querySchema) {
      const { error, value } = querySchema.validate(req.query, {
        abortEarly: true,
        stripUnknown: true
      });
      if (error) {
        return res.status(400).json({
          message: error.details[0].message
        });
      }
      req.validated = value;
    }

    next();
  };
};

export default validateRequest;
