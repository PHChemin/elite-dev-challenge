import type { ApiErrorBody, FieldErrors } from "./types";
import i18n from "../i18n";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly fieldErrors: FieldErrors;

  constructor(
    statusCode: number,
    message: string,
    fieldErrors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

function resolveMessage(
  body: ApiErrorBody | undefined,
  fallback: string,
): string {
  if (!body) {
    return fallback;
  }
  if (typeof body.message === "string" && body.message.length > 0) {
    return body.message;
  }
  if (Array.isArray(body.message) && body.message[0]) {
    return body.message[0];
  }
  return fallback;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, i18n.t("errors.api.connectionFailed"));
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(response.status, i18n.t("errors.api.invalidResponse"));
  }

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody;
    throw new ApiError(
      errorBody.statusCode ?? response.status,
      resolveMessage(errorBody, i18n.t("auth.login.fallback")),
      errorBody.fieldErrors ?? {},
    );
  }

  return payload as T;
}
