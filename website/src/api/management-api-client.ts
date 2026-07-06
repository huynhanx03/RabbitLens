import { z } from "zod";
import type { AuthSession } from "@/auth/auth-session";
import { ApiError, type ApiErrorKind } from "./api-error";

type ManagementApiClientOptions = {
  baseUrl: string;
  getSession: () => AuthSession;
  timeoutMs: number;
  fetcher?: typeof fetch;
  onUnauthorized: () => void;
};

type ErrorDetails = {
  error?: unknown;
  reason?: unknown;
};

function joinApiUrl(baseUrl: string, path: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

function getAuthorization(session: AuthSession): string | null {
  switch (session.type) {
    case "basic":
      return session.authorization;
    case "bearer":
    case "expiring":
      return `Bearer ${session.accessToken}`;
    case "anonymous":
    case "restoring_oauth":
    case "expired":
      return null;
  }
}

function getErrorKind(status: number): ApiErrorKind {
  switch (status) {
    case 400:
    case 412:
      return "validation";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not-found";
    case 409:
      return "conflict";
    case 408:
      return "timeout";
    case 429:
      return "server";
    default:
      return status >= 500 ? "server" : "unexpected";
  }
}

function isRetryable(kind: ApiErrorKind): boolean {
  return kind === "network" || kind === "timeout" || kind === "server";
}

const SENSITIVE_PATTERNS = [
  /amqp[s]?:\/\/[^:]+:[^@]+@/gi,
  /Bearer\s+[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_=]*/gi,
  /Basic\s+[A-Za-z0-9=]+/gi,
];

function redact(value: string, authorization: string | null): string {
  let redacted = value;
  if (authorization) {
    redacted = redacted.split(authorization).join("[REDACTED]");
  }
  for (const pattern of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, (match) => {
      if (match.toLowerCase().startsWith("amqp")) {
        return match.replace(/:[^:@]+@/, ":[REDACTED]@");
      }
      return match.split(" ")[0] + " [REDACTED]";
    });
  }
  redacted = redacted.replace(
    /(code|state|access_token|refresh_token|id_token)=([^&\s]+)/gi,
    "$1=[REDACTED]",
  );
  return redacted;
}

async function getErrorMessage(
  response: Response,
  authorization: string | null,
): Promise<string> {
  try {
    const details = (await response.json()) as ErrorDetails;
    const message =
      typeof details.reason === "string"
        ? details.reason
        : typeof details.error === "string"
          ? details.error
          : null;

    if (message) {
      return redact(message, authorization);
    }
  } catch {
    // RabbitMQ can return an empty or non-JSON proxy response.
  }

  return response.statusText || `RabbitMQ request failed: ${response.status}`;
}

export class ManagementApiClient {
  private readonly baseUrl: string;
  private readonly getSession: () => AuthSession;
  private readonly timeoutMs: number;
  private readonly fetcher: typeof fetch;
  private readonly onUnauthorized: () => void;

  constructor(options: ManagementApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.getSession = options.getSession;
    this.timeoutMs = options.timeoutMs;
    this.fetcher = options.fetcher ?? fetch;
    this.onUnauthorized = options.onUnauthorized;
  }

  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await this.execute(path, init);
    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new ApiError(
        "compatibility",
        response.status,
        false,
        "RabbitMQ returned invalid JSON",
      );
    }

    const result = schema.safeParse(payload);
    if (!result.success) {
      throw new ApiError(
        "compatibility",
        response.status,
        false,
        "RabbitMQ returned an unsupported response",
      );
    }

    return result.data;
  }

  async requestVoid(path: string, init: RequestInit = {}): Promise<void> {
    await this.execute(path, init);
  }

  async requestBlob(path: string, init: RequestInit = {}): Promise<Blob> {
    const response = await this.execute(path, init);
    return response.blob();
  }

  private async execute(path: string, init: RequestInit): Promise<Response> {
    const session = this.getSession();
    const authorization = getAuthorization(session);
    const headers = new Headers(init.headers);
    const controller = new AbortController();
    let timedOut = false;

    headers.set("Accept", "application/json");
    if (authorization) {
      headers.set("Authorization", authorization);
    } else {
      headers.delete("Authorization");
    }

    const abortFromCaller = () => controller.abort(init.signal?.reason);
    if (init.signal?.aborted) {
      abortFromCaller();
    } else {
      init.signal?.addEventListener("abort", abortFromCaller, { once: true });
    }

    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await this.fetcher.call(
        window,
        joinApiUrl(this.baseUrl, path),
        {
          ...init,
          headers,
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const kind = getErrorKind(response.status);
        if (kind === "unauthorized") {
          this.onUnauthorized();
        }
        
        let retryAfterMs: number | undefined;
        if (response.status === 429 || response.status === 503) {
          const retryAfter = response.headers.get("Retry-After");
          if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            if (!isNaN(seconds)) {
              retryAfterMs = seconds * 1000;
            } else {
              const date = new Date(retryAfter).getTime();
              if (!isNaN(date)) {
                retryAfterMs = Math.max(0, date - Date.now());
              }
            }
          }
        }

        throw new ApiError(
          kind,
          response.status,
          isRetryable(kind),
          await getErrorMessage(response, authorization),
          retryAfterMs,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (timedOut) {
        throw new ApiError("timeout", undefined, true, "RabbitMQ request timed out");
      }
      if (init.signal?.aborted) {
        throw error;
      }
      throw new ApiError("network", undefined, true, "RabbitMQ request failed");
    } finally {
      window.clearTimeout(timeoutId);
      init.signal?.removeEventListener("abort", abortFromCaller);
    }
  }
}
