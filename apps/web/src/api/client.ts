import axios, { isAxiosError } from "axios";
import type { ApiErrorBody, FieldErrors } from "./types";
import { readSession } from "../auth/storage";
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

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const session = readSession();
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);

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

function toApiError(error: unknown): ApiError {
  if (!isAxiosError(error) || !error.response) {
    return new ApiError(0, i18n.t("errors.api.connectionFailed"));
  }

  const payload = error.response.data;
  if (!payload || typeof payload !== "object") {
    return new ApiError(
      error.response.status,
      i18n.t("errors.api.invalidResponse"),
    );
  }

  const body = payload as ApiErrorBody;
  return new ApiError(
    body.statusCode ?? error.response.status,
    resolveMessage(body, i18n.t("auth.login.fallback")),
    body.fieldErrors ?? {},
  );
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const { data } = await api.get<T>(path, { params });
  return data;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(path, body);
  return data;
}
