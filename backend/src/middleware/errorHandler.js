import { env } from "../config/env.js";

export function notFound(req, res) {
  res.status(404).json({ message: "Recurso no encontrado." });
}

export function errorHandler(error, req, res, next) {
  const status = error.status || 500;
  const response = { message: error.publicMessage || "Error interno del servidor." };

  if (env.nodeEnv !== "production") {
    response.detail = error.message;
  }

  res.status(status).json(response);
}
