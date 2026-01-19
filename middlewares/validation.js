const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const formattedErrors = result.error.issues.map((err) => ({
      field: err.path[0],
      message: err.message,
    }));
    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message,
      errors: formattedErrors,
    });
  }
  req.body = result.data;
  next();
};

export default validate;
