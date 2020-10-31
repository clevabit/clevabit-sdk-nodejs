export class ApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
