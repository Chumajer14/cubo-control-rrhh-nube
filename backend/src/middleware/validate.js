export function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: "Datos invalidos.",
        errors: result.error.flatten()
      });
    }
    req[source] = result.data;
    next();
  };
}
