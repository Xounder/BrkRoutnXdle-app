import type { Request, Response, NextFunction } from "express";
import type { ApiResponse, ApiError } from "@brkroutnxdle/shared";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const apiError: ApiError = { code: err.code, message: err.message, details: err.details };
    res.status(err.statusCode).json({ success: false, error: apiError });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}