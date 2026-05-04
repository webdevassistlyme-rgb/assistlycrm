import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = error.name === "ValidationError" ? 400 : 500;
  response.status(status).json({
    message: error.message || "Server error",
  });
};
