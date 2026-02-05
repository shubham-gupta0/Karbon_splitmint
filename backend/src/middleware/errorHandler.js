export function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  // Prisma errors
  if (err.code === "P2002") {
    statusCode = 409;
    message = "A record with this information already exists";
  } else if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found";
  }

  // Joi validation errors
  if (err.details) {
    statusCode = 400;
    message = err.details.map((d) => d.message).join(", ");
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
