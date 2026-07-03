export type ApiErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "validation"
  | "network"
  | "timeout"
  | "compatibility"
  | "server"
  | "unexpected";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  readonly retryable: boolean;

  readonly retryAfterMs: number | undefined;

  constructor(
    kind: ApiErrorKind,
    status: number | undefined,
    retryable: boolean,
    message: string,
    retryAfterMs?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.retryable = retryable;
    this.retryAfterMs = retryAfterMs;
  }
}
