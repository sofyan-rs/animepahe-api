export class CustomError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const toErrorPayload = (error: unknown) => {
  const err = error as {
    message?: string;
    statusCode?: number;
    response?: { status?: number };
    stack?: string;
  };

  const statusCode = err.response?.status ?? err.statusCode ?? 500;
  const message = err.message ?? "Something went wrong";

  return {
    statusCode,
    message,
    stack: err.stack,
  };
};
