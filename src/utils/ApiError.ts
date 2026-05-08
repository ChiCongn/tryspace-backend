export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}
