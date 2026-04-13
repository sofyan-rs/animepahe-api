import type { Context } from "hono";
import { toErrorPayload } from "../lib/errors";

export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const handleAppError = (error: unknown, c: Context): Response => {
  const payload = toErrorPayload(error);
  console.error(`Error: ${payload.message} (Status Code: ${payload.statusCode})`);

  const response: Record<string, unknown> = {
    status: payload.statusCode,
    message: payload.message,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = payload.stack;
  }

  return c.json(response, payload.statusCode as 200 | 400 | 401 | 403 | 404 | 429 | 500);
};
